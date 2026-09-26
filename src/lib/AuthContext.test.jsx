import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Define window mock before imports
globalThis.window = {
  location: {
    href: 'http://localhost/app',
  },
};

// State storage for useState mock
let stateMap = {};
let effectCallback = null;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createContext: vi.fn(() => ({
      Provider: ({ value, children }) => ({ type: 'Provider', props: { value, children } }),
    })),
    useState: (initial) => {
      const callId = Object.keys(stateMap).length;
      if (!(callId in stateMap)) {
        stateMap[callId] = {
          value: typeof initial === 'function' ? initial() : initial,
          setter: vi.fn((newVal) => {
            stateMap[callId].value = typeof newVal === 'function' ? newVal(stateMap[callId].value) : newVal;
          }),
        };
      }
      return [stateMap[callId].value, stateMap[callId].setter];
    },
    useEffect: (cb) => {
      effectCallback = cb;
    },
    useContext: vi.fn(),
  };
});

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn(),
      logout: vi.fn(),
    },
  },
}));

// Mock appParams
vi.mock('@/lib/app-params', () => ({
  appParams: {
    token: 'mock-token',
    appId: 'mock-app-id',
  },
}));

import React, { useContext } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

describe('AuthContext', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stateMap = {};
    effectCallback = null;
    appParams.token = 'mock-token';
    appParams.appId = 'mock-app-id';
    globalThis.window.location.href = 'http://localhost/app';
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('useAuth hook', () => {
    it('throws an error when used outside AuthProvider', () => {
      vi.mocked(useContext).mockReturnValueOnce(null);

      expect(() => useAuth()).toThrow('useAuth must be used within an AuthProvider');
    });

    it('returns context value when used within AuthProvider', () => {
      const mockContextValue = { user: { id: '123', name: 'Test User' }, isAuthenticated: true };
      vi.mocked(useContext).mockReturnValueOnce(mockContextValue);

      const context = useAuth();
      expect(context).toBe(mockContextValue);
    });
  });

  describe('AuthProvider', () => {
    const renderProvider = () => {
      stateMap = {};
      effectCallback = null;
      const element = AuthProvider({ children: 'Child Content' });
      return {
        element,
        contextValue: element.props.value,
        stateMap,
        triggerEffect: async () => {
          if (effectCallback) {
            effectCallback();
            // Wait for unresolved promises in the microtask queue
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        },
      };
    };

    it('renders provider with initial state and methods', () => {
      const { element, contextValue } = renderProvider();

      expect(element).toBeDefined();
      expect(element.props.children).toBe('Child Content');

      expect(contextValue.user).toBeNull();
      expect(contextValue.isAuthenticated).toBe(false);
      expect(contextValue.isLoadingAuth).toBe(true);
      expect(contextValue.isLoadingPublicSettings).toBe(true);
      expect(contextValue.authError).toBeNull();
      expect(contextValue.authChecked).toBe(false);
      expect(contextValue.appPublicSettings).toBeNull();
      expect(typeof contextValue.logout).toBe('function');
      expect(typeof contextValue.navigateToLogin).toBe('function');
      expect(typeof contextValue.checkUserAuth).toBe('function');
      expect(typeof contextValue.checkAppState).toBe('function');
    });

    describe('checkAppState', () => {
      it('authenticates user and sets app public settings when token exists', async () => {
        const mockUser = { id: 'u1', email: 'test@example.com' };
        base44.auth.me.mockResolvedValueOnce(mockUser);

        const { contextValue, stateMap } = renderProvider();

        await contextValue.checkAppState();

        // setIsLoadingPublicSettings(true)
        expect(stateMap[3].setter).toHaveBeenCalledWith(true);
        // setAuthError(null)
        expect(stateMap[4].setter).toHaveBeenCalledWith(null);

        // checkUserAuth execution
        expect(stateMap[2].setter).toHaveBeenCalledWith(true); // isLoadingAuth = true
        expect(base44.auth.me).toHaveBeenCalled();
        expect(stateMap[0].setter).toHaveBeenCalledWith(mockUser); // user
        expect(stateMap[1].setter).toHaveBeenCalledWith(true); // isAuthenticated
        expect(stateMap[2].setter).toHaveBeenCalledWith(false); // isLoadingAuth = false
        expect(stateMap[5].setter).toHaveBeenCalledWith(true); // authChecked = true

        // setAppPublicSettings & setIsLoadingPublicSettings(false)
        expect(stateMap[6].setter).toHaveBeenCalledWith({ id: 'mock-app-id' });
        expect(stateMap[3].setter).toHaveBeenCalledWith(false);
      });

      it('still tries me() when token is null and settles as logged out', async () => {
        appParams.token = null;
        base44.auth.me.mockRejectedValueOnce(new Error('No token'));

        const { contextValue, stateMap } = renderProvider();

        await contextValue.checkAppState();

        expect(base44.auth.me).toHaveBeenCalled();
        expect(stateMap[2].setter).toHaveBeenCalledWith(false); // isLoadingAuth
        expect(stateMap[1].setter).toHaveBeenCalledWith(false); // isAuthenticated
        expect(stateMap[5].setter).toHaveBeenCalledWith(true); // authChecked
        expect(stateMap[6].setter).toHaveBeenCalledWith({ id: 'mock-app-id' });
        expect(stateMap[3].setter).toHaveBeenCalledWith(false); // isLoadingPublicSettings
      });

      it('handles auth_required / 401 error', async () => {
        const { contextValue, stateMap } = renderProvider();

        const originalAppId = appParams.appId;
        Object.defineProperty(appParams, 'appId', {
          get: () => {
            throw { status: 401, data: { extra_data: { reason: 'auth_required' } } };
          },
          configurable: true,
        });

        await contextValue.checkAppState();

        Object.defineProperty(appParams, 'appId', {
          value: originalAppId,
          writable: true,
          configurable: true,
        });

        expect(stateMap[4].setter).toHaveBeenCalledWith({
          type: 'auth_required',
          message: 'Authentication required',
        });
        expect(stateMap[3].setter).toHaveBeenCalledWith(false);
      });

      it('handles user_not_registered error', async () => {
        const { contextValue, stateMap } = renderProvider();

        const originalAppId = appParams.appId;
        Object.defineProperty(appParams, 'appId', {
          get: () => {
            throw { data: { extra_data: { reason: 'user_not_registered' } } };
          },
          configurable: true,
        });

        await contextValue.checkAppState();

        Object.defineProperty(appParams, 'appId', {
          value: originalAppId,
          writable: true,
          configurable: true,
        });

        expect(stateMap[4].setter).toHaveBeenCalledWith({
          type: 'user_not_registered',
          message: 'User not registered for this app',
        });
        expect(stateMap[3].setter).toHaveBeenCalledWith(false);
      });

      it('keeps public routes reachable on an unknown app error reason', async () => {
        const { contextValue, stateMap } = renderProvider();

        const originalAppId = appParams.appId;
        Object.defineProperty(appParams, 'appId', {
          get: () => {
            throw {
              data: { extra_data: { reason: 'app_suspended' } },
              message: 'App is suspended',
            };
          },
          configurable: true,
        });

        await contextValue.checkAppState();

        Object.defineProperty(appParams, 'appId', {
          value: originalAppId,
          writable: true,
          configurable: true,
        });

        expect(stateMap[4].setter).toHaveBeenLastCalledWith(null);
        expect(stateMap[3].setter).toHaveBeenCalledWith(false);
        expect(stateMap[2].setter).toHaveBeenCalledWith(false);
      });

      it('keeps public routes reachable on a network error', async () => {
        const { contextValue, stateMap } = renderProvider();

        const originalAppId = appParams.appId;
        Object.defineProperty(appParams, 'appId', {
          get: () => {
            throw new Error('Network error');
          },
          configurable: true,
        });

        await contextValue.checkAppState();

        Object.defineProperty(appParams, 'appId', {
          value: originalAppId,
          writable: true,
          configurable: true,
        });

        expect(stateMap[4].setter).toHaveBeenLastCalledWith(null);
      });

      it('surfaces user_not_registered returned by the session check', async () => {
        base44.auth.me.mockRejectedValueOnce({ data: { extra_data: { reason: 'user_not_registered' } } });

        const { contextValue, stateMap } = renderProvider();

        await contextValue.checkAppState();

        expect(stateMap[4].setter).toHaveBeenLastCalledWith({
          type: 'user_not_registered',
          message: 'User not registered for this app',
        });
        expect(stateMap[1].setter).toHaveBeenCalledWith(false);
      });
    });

    describe('checkUserAuth', () => {
      it('handles user auth failure gracefully without setting authError', async () => {
        base44.auth.me.mockRejectedValueOnce(new Error('Invalid token'));

        const { contextValue, stateMap } = renderProvider();

        await contextValue.checkUserAuth();

        expect(stateMap[2].setter).toHaveBeenCalledWith(true);
        expect(stateMap[2].setter).toHaveBeenCalledWith(false);
        expect(stateMap[1].setter).toHaveBeenCalledWith(false);
        expect(stateMap[5].setter).toHaveBeenCalledWith(true);
      });
    });

    describe('logout', () => {
      it('resets user state and logs out with redirect by default', () => {
        const { contextValue, stateMap } = renderProvider();

        contextValue.logout();

        expect(stateMap[0].setter).toHaveBeenCalledWith(null);
        expect(stateMap[1].setter).toHaveBeenCalledWith(false);
        expect(base44.auth.logout).toHaveBeenCalledWith('http://localhost/app');
      });

      it('resets user state and logs out without redirect when shouldRedirect is false', () => {
        const { contextValue, stateMap } = renderProvider();

        contextValue.logout(false);

        expect(stateMap[0].setter).toHaveBeenCalledWith(null);
        expect(stateMap[1].setter).toHaveBeenCalledWith(false);
        expect(base44.auth.logout).toHaveBeenCalledWith();
      });
    });

    describe('navigateToLogin', () => {
      it('sets window.location.href to /login', () => {
        const { contextValue } = renderProvider();

        contextValue.navigateToLogin();

        expect(globalThis.window.location.href).toBe('/login');
      });
    });

    describe('useEffect initialization', () => {
      it('triggers checkAppState on mount', async () => {
        base44.auth.me.mockResolvedValueOnce({ id: 'u1' });
        const { triggerEffect, stateMap } = renderProvider();

        expect(effectCallback).toBeDefined();

        await triggerEffect();

        expect(base44.auth.me).toHaveBeenCalled();
        expect(stateMap[6].setter).toHaveBeenCalledWith({ id: 'mock-app-id' });
      });
    });
  });
});
