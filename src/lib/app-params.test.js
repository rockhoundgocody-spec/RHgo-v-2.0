import { describe, it, expect, beforeAll } from 'vitest';

let getSafeRedirectUrl;

beforeAll(async () => {
  const storageMap = new Map();
  globalThis.document = { title: 'Test' };
  globalThis.window = {
    location: {
      href: 'https://rockhoundgo.com/app',
      origin: 'https://rockhoundgo.com',
      pathname: '/app',
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

  const module = await import('./app-params.js');
  getSafeRedirectUrl = module.getSafeRedirectUrl;
});

describe('getSafeRedirectUrl', () => {
  it('allows safe relative paths', () => {
    expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('/settings?tab=general')).toBe('/settings?tab=general');
    expect(getSafeRedirectUrl('/collection/123')).toBe('/collection/123');
  });

  it('allows same-origin absolute URLs', () => {
    expect(getSafeRedirectUrl('https://rockhoundgo.com/explore')).toBe('https://rockhoundgo.com/explore');
    expect(getSafeRedirectUrl('https://rockhoundgo.com/profile?id=1')).toBe('https://rockhoundgo.com/profile?id=1');
  });

  it('blocks open redirect attempts to external domains', () => {
    expect(getSafeRedirectUrl('https://evil.com')).toBe('/');
    expect(getSafeRedirectUrl('http://attacker.org/phishing')).toBe('/');
    expect(getSafeRedirectUrl('//evil.com/path')).toBe('/');
  });

  it('blocks protocol-relative slash bypasses', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('///evil.com')).toBe('/');
  });

  it('blocks javascript and data URIs', () => {
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
  });

  it('handles null, undefined, or empty string gracefully with fallback', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl('   ')).toBe('/');
    expect(getSafeRedirectUrl('https://evil.com', '/fallback')).toBe('/fallback');
  });
});
