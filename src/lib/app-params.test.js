import { describe, it, expect, beforeAll } from 'vitest';

describe('getSafeRedirectUrl', () => {
  let getSafeRedirectUrl;

  beforeAll(async () => {
    // Setup window and document mock for browser environment simulation
    if (typeof globalThis.window === 'undefined') {
      const storageMap = new Map();
      globalThis.document = { title: '' };
      globalThis.window = {
        location: {
          origin: 'https://rockhound-go.app',
          href: 'https://rockhound-go.app/',
          pathname: '/',
          search: '',
          hash: '',
        },
        history: {
          replaceState: () => {},
        },
        localStorage: {
          getItem: (key) => storageMap.get(key) || null,
          setItem: (key, val) => storageMap.set(key, String(val)),
          removeItem: (key) => storageMap.delete(key),
        },
      };
    }

    const module = await import('./app-params.js');
    getSafeRedirectUrl = module.getSafeRedirectUrl;
  });

  it('allows safe relative paths', () => {
    expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('/settings?tab=general#profile')).toBe('/settings?tab=general#profile');
    expect(getSafeRedirectUrl('/explore')).toBe('/explore');
  });

  it('allows same-origin absolute URLs', () => {
    expect(getSafeRedirectUrl('https://rockhound-go.app/dashboard')).toBe('/dashboard');
  });

  it('rejects protocol-relative and bypass attempt URLs', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('//evil.com/path')).toBe('/');
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
  });

  it('rejects external domain URLs', () => {
    expect(getSafeRedirectUrl('https://evil.com')).toBe('/');
    expect(getSafeRedirectUrl('http://phishing.site/login')).toBe('/');
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
  });

  it('uses custom fallback URL when provided', () => {
    expect(getSafeRedirectUrl('https://evil.com', '/fallback')).toBe('/fallback');
  });

  it('handles null, undefined or non-string inputs safely', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl(123)).toBe('/');
  });
});
