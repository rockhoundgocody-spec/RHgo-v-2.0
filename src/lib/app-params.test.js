import { vi, describe, it, expect, beforeAll } from 'vitest';

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

let getSafeRedirectUrl;
let getStorageForParam;
let appParams;

describe('app-params', () => {
  beforeAll(async () => {
    // Set global window BEFORE importing the module so that isNode is evaluated as false
    globalThis.window = {
      location: {
        search: '',
        href: 'http://localhost:3000/settings',
        pathname: '/settings',
        origin: 'http://localhost:3000',
        hash: '',
      },
      history: {
        replaceState: vi.fn(),
      },
      localStorage: mockLocalStorage,
      sessionStorage: mockSessionStorage,
    };

    globalThis.document = {
      title: 'Test Title',
    };

    // Dynamically import to ensure globalThis.window is set first
    const module = await import('./app-params.js');
    getSafeRedirectUrl = module.getSafeRedirectUrl;
    getStorageForParam = module.getStorageForParam;
    appParams = module.appParams;
  });

  describe('getSafeRedirectUrl', () => {
    it('should allow relative paths starting with a single "/"', () => {
      expect(getSafeRedirectUrl('/profile')).toBe('/profile');
      expect(getSafeRedirectUrl('/settings?key=val')).toBe('/settings?key=val');
    });

    it('should allow same-origin absolute URLs', () => {
      expect(getSafeRedirectUrl('http://localhost:3000/dashboard')).toBe('http://localhost:3000/dashboard');
    });

    it('should reject and fallback on external absolute URLs', () => {
      expect(getSafeRedirectUrl('http://malicious.com/hack', '/')).toBe('/');
      expect(getSafeRedirectUrl('https://google.com', '/default')).toBe('/default');
    });

    it('should reject bypass attempts starting with multiple slashes or backslashes', () => {
      expect(getSafeRedirectUrl('//malicious.com', '/')).toBe('/');
      expect(getSafeRedirectUrl('\\\\malicious.com', '/')).toBe('/');
      expect(getSafeRedirectUrl('///malicious.com', '/')).toBe('/');
      expect(getSafeRedirectUrl('/\\malicious.com', '/')).toBe('/');
      expect(getSafeRedirectUrl('\\/malicious.com', '/')).toBe('/');
    });

    it('should handle falsy/empty values gracefully', () => {
      expect(getSafeRedirectUrl('', '/home')).toBe('/home');
      expect(getSafeRedirectUrl(null, '/home')).toBe('/home');
      expect(getSafeRedirectUrl(undefined, '/home')).toBe('/home');
    });
  });

  describe('getStorageForParam', () => {
    it('should route token parameters to sessionStorage', () => {
      const storage = getStorageForParam('access_token');
      expect(storage).toBe(mockSessionStorage);

      const tokenStorage = getStorageForParam('token');
      expect(tokenStorage).toBe(mockSessionStorage);
    });

    it('should route standard parameters to localStorage', () => {
      const storage = getStorageForParam('app_id');
      expect(storage).toBe(mockLocalStorage);

      const fromUrlStorage = getStorageForParam('from_url');
      expect(fromUrlStorage).toBe(mockLocalStorage);
    });
  });

  describe('app-params initialization and token purging', () => {
    it('proactively purges legacy keys from localStorage on initialization', () => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('base44_access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
