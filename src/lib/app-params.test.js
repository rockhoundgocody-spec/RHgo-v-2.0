import { vi, describe, it, expect } from 'vitest';

const { mockLocalStorage, mockSessionStorage } = vi.hoisted(() => {
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

  const mockWindow = {
    location: {
      search: '',
      href: 'http://localhost:3000/app',
      pathname: '/app',
      origin: 'http://localhost:3000',
    },
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    history: {
      replaceState: vi.fn(),
    },
    document: {
      title: 'RockHound GO',
    }
  };

  Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    configurable: true,
    writable: true
  });

  return { mockLocalStorage, mockSessionStorage };
});

// We import our module after setting up the global window mock via vi.hoisted
import { getSafeRedirectUrl } from './app-params.js';

describe('getSafeRedirectUrl', () => {
  it('should allow relative paths starting with a single slash', () => {
    expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('/profile/settings')).toBe('/profile/settings');
    expect(getSafeRedirectUrl('/')).toBe('/');
  });

  it('should reject invalid types and return default value', () => {
    expect(getSafeRedirectUrl(null, '/default')).toBe('/default');
    expect(getSafeRedirectUrl(undefined, '/default')).toBe('/default');
    expect(getSafeRedirectUrl(123, '/default')).toBe('/default');
    expect(getSafeRedirectUrl('', '/default')).toBe('/default');
  });

  it('should reject open redirect bypass attempts', () => {
    expect(getSafeRedirectUrl('//attacker.com', '/default')).toBe('/default');
    expect(getSafeRedirectUrl('\\\\attacker.com', '/default')).toBe('/default');
    expect(getSafeRedirectUrl('\\attacker.com', '/default')).toBe('/default');
    expect(getSafeRedirectUrl('/\\attacker.com', '/default')).toBe('/default');
    expect(getSafeRedirectUrl('\\/attacker.com', '/default')).toBe('/default');
    expect(getSafeRedirectUrl('///attacker.com', '/default')).toBe('/default');
  });

  it('should reject different-origin absolute URLs', () => {
    expect(getSafeRedirectUrl('https://attacker.com', '/default')).toBe('/default');
    expect(getSafeRedirectUrl('http://evil.com/path', '/default')).toBe('/default');
  });

  it('should allow same-origin absolute URLs', () => {
    expect(getSafeRedirectUrl('http://localhost:3000/dashboard', '/default')).toBe('http://localhost:3000/dashboard');
  });

  it('should purge legacy keys from localStorage on initialization', () => {
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('base44_access_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('base44_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });
});
