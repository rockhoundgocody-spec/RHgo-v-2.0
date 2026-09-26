import { describe, it, expect, beforeAll } from 'vitest';

let getLoginRedirectUrl;

beforeAll(async () => {
  globalThis.window = {
    location: {
      origin: 'https://rhgo.app',
      href: 'https://rhgo.app/login',
      pathname: '/login',
      search: '',
      hash: '',
    },
    history: {
      replaceState: () => {},
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.document = {
    title: 'RockHound GO',
  };

  const mod = await import('./Login');
  getLoginRedirectUrl = mod.getLoginRedirectUrl;
});

describe('getLoginRedirectUrl', () => {
  it('allows safe relative paths and query parameters', () => {
    expect(getLoginRedirectUrl('/explore')).toBe('/explore');
    expect(getLoginRedirectUrl('/settings?tab=account')).toBe('/settings?tab=account');
    expect(getLoginRedirectUrl('/scan#reticle')).toBe('/scan#reticle');
  });

  it('rejects protocol-relative open redirect attempts (//evil.com)', () => {
    expect(getLoginRedirectUrl('//evil.com')).toBe('/profile');
    expect(getLoginRedirectUrl('//attacker.com/login')).toBe('/profile');
    expect(getLoginRedirectUrl('///evil.com')).toBe('/profile');
  });

  it('rejects backslash and control character open redirect attempts', () => {
    expect(getLoginRedirectUrl('/\\evil.com')).toBe('/profile');
    expect(getLoginRedirectUrl('/\\attacker.com')).toBe('/profile');
    expect(getLoginRedirectUrl('/\t//evil.com')).toBe('/profile');
    expect(getLoginRedirectUrl('/\n//evil.com')).toBe('/profile');
  });

  it('rejects absolute external URLs', () => {
    expect(getLoginRedirectUrl('https://evil.com/phish')).toBe('/profile');
    expect(getLoginRedirectUrl('http://attacker.org')).toBe('/profile');
  });

  it('rejects dangerous script schemes', () => {
    expect(getLoginRedirectUrl('javascript:alert(1)')).toBe('/profile');
  });

  it('falls back to default path for null, undefined, or non-string inputs', () => {
    expect(getLoginRedirectUrl(null)).toBe('/profile');
    expect(getLoginRedirectUrl(undefined)).toBe('/profile');
    expect(getLoginRedirectUrl('')).toBe('/profile');
    expect(getLoginRedirectUrl(12345)).toBe('/profile');
  });
});
