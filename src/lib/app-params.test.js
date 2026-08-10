import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';

// Define window and document in global scope before loading module
const mockLocation = {
  search: '',
  href: 'http://localhost/',
  pathname: '/',
  hash: '',
  origin: 'http://localhost',
};

const mockHistory = {
  replaceState: vi.fn(),
};

const mockLocalStorage = {
  _store: {},
  getItem(key) { return this._store[key] || null; },
  setItem(key, val) { this._store[key] = String(val); },
  removeItem(key) { delete this._store[key]; },
  get length() { return Object.keys(this._store).length; },
  key(index) { return Object.keys(this._store)[index] || null; }
};

const mockSessionStorage = {
  _store: {},
  getItem(key) { return this._store[key] || null; },
  setItem(key, val) { this._store[key] = String(val); },
  removeItem(key) { delete this._store[key]; },
  get length() { return Object.keys(this._store).length; },
  key(index) { return Object.keys(this._store)[index] || null; }
};

beforeAll(() => {
  globalThis.window = {
    location: mockLocation,
    history: mockHistory,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
  };
  globalThis.document = {
    title: 'RockHound-GO',
  };
});

beforeEach(() => {
  vi.resetModules();
  mockLocation.search = '';
  mockLocation.href = 'http://localhost/';
  mockLocation.pathname = '/';
  mockLocation.hash = '';
  mockHistory.replaceState.mockClear();
  mockLocalStorage._store = {};
  mockSessionStorage._store = {};
});

describe('getSafeRedirectUrl', () => {
  it('should allow same-origin absolute URLs', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('http://localhost/home')).toBe('http://localhost/home');
    expect(getSafeRedirectUrl('http://localhost/explore?lat=1')).toBe('http://localhost/explore?lat=1');
  });

  it('should allow relative paths starting with a single slash', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('/explore')).toBe('/explore');
    expect(getSafeRedirectUrl('/specimen/123')).toBe('/specimen/123');
  });

  it('should reject open redirect bypass attempts', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('//attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('\\\\attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('\\/attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('///attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('\\attacker.com')).toBe('/');
  });

  it('should reject external malicious absolute URLs', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('https://attacker.com/some/path')).toBe('/');
  });

  it('should fall back to custom fallback if provided and target is invalid', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('https://attacker.com', '/fallback')).toBe('/fallback');
  });
});

describe('appParams storage and token routing', () => {
  it('should route keys containing token to sessionStorage', async () => {
    // Set up local storage with a legacy token to test purging
    mockLocalStorage.setItem('base44_access_token', 'legacy-token');
    mockLocalStorage.setItem('other_token_key', 'other-legacy');
    mockLocalStorage.setItem('safe_key', 'keep-me');

    const { appParams } = await import('./app-params.js');

    // Legacy tokens should be purged from localStorage on initialization
    expect(mockLocalStorage.getItem('base44_access_token')).toBeNull();
    expect(mockLocalStorage.getItem('other_token_key')).toBeNull();
    expect(mockLocalStorage.getItem('safe_key')).toBe('keep-me');
  });
});
