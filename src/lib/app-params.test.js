import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('getSafeRedirectUrl', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
    vi.resetModules();
  });

  it('should sanitize redirect targets correctly', async () => {
    // Setup mock window origin for absolute URL comparison
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          origin: 'http://localhost:3000'
        }
      },
      writable: true,
      configurable: true
    });

    const { getSafeRedirectUrl } = await import('./app-params.js');

    // Safe relative URLs
    expect(getSafeRedirectUrl('/home')).toBe('/home');
    expect(getSafeRedirectUrl('/settings?tab=profile')).toBe('/settings?tab=profile');

    // Safe same-origin absolute URLs
    expect(getSafeRedirectUrl('http://localhost:3000/home')).toBe('http://localhost:3000/home');

    // Unsafe protocol-relative URLs (open redirect bypass attempt)
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('\\\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('/\/evil.com')).toBe('/');

    // Unsafe cross-origin URLs
    expect(getSafeRedirectUrl('https://evil.com/login')).toBe('/');
    expect(getSafeRedirectUrl('http://evil.com/home')).toBe('/');

    // Dangerous protocols / javascript URIs
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirectUrl('data:text/html,malicious')).toBe('/');

    // Edge cases and empty inputs
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl({}, '/fallback')).toBe('/fallback');
  });
});

describe('appParams storage routing and legacy purging', () => {
  let mockLocalStorage = {};
  let mockSessionStorage = {};
  let originalWindow;

  beforeEach(() => {
    originalWindow = globalThis.window;
    mockLocalStorage = {
      'base44_access_token': 'legacy_access_token_val',
      'base44_token': 'legacy_token_val',
      'token': 'legacy_bare_token_val',
      'base44_non_sensitive': 'keep_me'
    };
    mockSessionStorage = {};

    const createMockStorage = (store) => ({
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    });

    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          origin: 'http://localhost:3000',
          href: 'http://localhost:3000/?access_token=url_token_abc&app_id=test_app_id&from_url=http://localhost:3000/custom-from',
          pathname: '/',
          search: '?access_token=url_token_abc&app_id=test_app_id&from_url=http://localhost:3000/custom-from',
          hash: ''
        },
        history: {
          replaceState: vi.fn()
        },
        document: {
          title: 'Test Title'
        },
        localStorage: createMockStorage(mockLocalStorage),
        sessionStorage: createMockStorage(mockSessionStorage)
      },
      writable: true,
      configurable: true
    });

    // Mock import.meta.env
    vi.stubEnv('VITE_BASE44_APP_ID', 'default_env_app_id');
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('should purge legacy localStorage keys on module load', async () => {
    await import('./app-params.js');

    // Sensitive legacy keys should be purged
    expect(mockLocalStorage['base44_access_token']).toBeUndefined();
    expect(mockLocalStorage['base44_token']).toBeUndefined();
    expect(mockLocalStorage['token']).toBeUndefined();

    // Non-sensitive keys are preserved
    expect(mockLocalStorage['base44_non_sensitive']).toBe('keep_me');
  });

  it('should route access_token and token to sessionStorage instead of localStorage', async () => {
    const { appParams } = await import('./app-params.js');

    // Verify token was loaded correctly from query param
    expect(appParams.token).toBe('url_token_abc');

    // Sensitive token should reside in sessionStorage
    expect(mockSessionStorage['base44_access_token']).toBe('url_token_abc');
    expect(mockLocalStorage['base44_access_token']).toBeUndefined();

    // App ID should reside in localStorage as it is not sensitive
    expect(mockLocalStorage['base44_app_id']).toBe('test_app_id');
    expect(mockSessionStorage['base44_app_id']).toBeUndefined();
  });

  it('should sanitize query parameters like from_url and redirect via getSafeRedirectUrl', async () => {
    // Set a malicious cross-origin URL for from_url query parameter
    window.location.search = '?from_url=https://evil.com/malicious&redirect=https://evil.com/another';
    window.location.href = `http://localhost:3000/${window.location.search}`;

    const { appParams } = await import('./app-params.js');

    // malicious absolute URLs should be rejected and fall back to safe local URLs
    expect(appParams.fromUrl).toBe('/');
    expect(appParams.redirectUrl).toBe('/');
  });
});
