import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let currentState;
let stateSetter;
let effectCallback;

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => {
      currentState = initial;
      stateSetter = vi.fn((val) => {
        currentState = typeof val === 'function' ? val(currentState) : val;
      });
      return [currentState, stateSetter];
    },
    useEffect: (cb) => {
      effectCallback = cb;
    },
  };
});

import { usePermissionState } from './usePermissionState.js';

describe('usePermissionState', () => {
  let originalPermissions;

  beforeEach(() => {
    currentState = 'prompt';
    stateSetter = null;
    effectCallback = null;
    originalPermissions = globalThis.navigator?.permissions;
  });

  afterEach(() => {
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'permissions', {
        value: originalPermissions,
        configurable: true,
        writable: true,
      });
    }
  });

  it('initializes state to "prompt" and returns state', () => {
    const state = usePermissionState('geolocation');
    expect(state).toBe('prompt');
  });

  it('returns undefined from effect when navigator or permissions.query is missing', () => {
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    usePermissionState('geolocation');
    const cleanup = effectCallback();

    expect(cleanup).toBeUndefined();
    expect(stateSetter).not.toHaveBeenCalled();
  });

  it('queries permission status and updates state when query resolves successfully', async () => {
    const mockStatus = {
      state: 'granted',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    let resolveQuery;
    const queryPromise = new Promise((resolve) => {
      resolveQuery = resolve;
    });

    const mockQuery = vi.fn(() => queryPromise);
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    usePermissionState('notifications');
    effectCallback();

    expect(mockQuery).toHaveBeenCalledWith({ name: 'notifications' });
    expect(mockStatus.addEventListener).not.toHaveBeenCalled();

    resolveQuery(mockStatus);
    await queryPromise;

    expect(stateSetter).toHaveBeenCalledWith('granted');
    expect(currentState).toBe('granted');
    expect(mockStatus.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('handles permission change events when status updates', async () => {
    let changeHandler;
    const mockStatus = {
      state: 'granted',
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };

    const mockQuery = vi.fn().mockResolvedValue(mockStatus);
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    usePermissionState('camera');
    effectCallback();

    await Promise.resolve(); // wait for promise microtask

    expect(changeHandler).toBeDefined();

    // Simulate status change
    mockStatus.state = 'denied';
    changeHandler();

    expect(stateSetter).toHaveBeenCalledWith('denied');
    expect(currentState).toBe('denied');
  });

  it('removes change event listener on cleanup', async () => {
    let changeHandler;
    const mockStatus = {
      state: 'granted',
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };

    const mockQuery = vi.fn().mockResolvedValue(mockStatus);
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    usePermissionState('microphone');
    const cleanup = effectCallback();

    await Promise.resolve(); // wait for promise microtask

    expect(mockStatus.addEventListener).toHaveBeenCalledWith('change', changeHandler);

    cleanup();

    expect(mockStatus.removeEventListener).toHaveBeenCalledWith('change', changeHandler);
  });

  it('ignores resolution and avoids updating state or attaching listeners if component unmounts before query resolves', async () => {
    const mockStatus = {
      state: 'granted',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    let resolveQuery;
    const queryPromise = new Promise((resolve) => {
      resolveQuery = resolve;
    });

    const mockQuery = vi.fn(() => queryPromise);
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    usePermissionState('geolocation');
    const cleanup = effectCallback();

    // Trigger cleanup prior to promise resolution (disposed = true)
    cleanup();

    resolveQuery(mockStatus);
    await queryPromise;

    expect(stateSetter).not.toHaveBeenCalled();
    expect(mockStatus.addEventListener).not.toHaveBeenCalled();
  });

  it('catches and ignores rejection when permissions.query promise rejects', async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error('Permission query error'));
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    usePermissionState('unknown-permission');
    effectCallback();

    await Promise.resolve(); // wait for rejection to settle

    expect(stateSetter).not.toHaveBeenCalled();
  });

  it('handles permissionStatus gracefully when optional addEventListener/removeEventListener are missing', async () => {
    const mockStatus = {
      state: 'denied',
      // addEventListener and removeEventListener are omitted
    };

    const mockQuery = vi.fn().mockResolvedValue(mockStatus);
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: { query: mockQuery },
      configurable: true,
      writable: true,
    });

    usePermissionState('clipboard-read');
    const cleanup = effectCallback();

    await Promise.resolve(); // wait for promise microtask

    expect(stateSetter).toHaveBeenCalledWith('denied');
    expect(currentState).toBe('denied');

    // Cleanup should not throw when removeEventListener is missing
    expect(() => cleanup()).not.toThrow();
  });
});
