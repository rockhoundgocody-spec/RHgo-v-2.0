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
    expect(getLoginRedirectUrl('//evil.com')).toBe('/');
    expect(getLoginRedirectUrl('//attacker.com/login')).toBe('/');
    expect(getLoginRedirectUrl('///evil.com')).toBe('/');
  });

  it('rejects backslash and control character open redirect attempts', () => {
    expect(getLoginRedirectUrl('/\\evil.com')).toBe('/');
    expect(getLoginRedirectUrl('/\\attacker.com')).toBe('/');
    expect(getLoginRedirectUrl('/\t//evil.com')).toBe('/');
    expect(getLoginRedirectUrl('/\n//evil.com')).toBe('/');
  });

  it('rejects absolute external URLs', () => {
    expect(getLoginRedirectUrl('https://evil.com/phish')).toBe('/');
    expect(getLoginRedirectUrl('http://attacker.org')).toBe('/');
  });

  it('rejects dangerous script schemes', () => {
    expect(getLoginRedirectUrl('javascript:alert(1)')).toBe('/');
  });

  it('falls back to default path for null, undefined, or non-string inputs', () => {
    expect(getLoginRedirectUrl(null)).toBe('/');
    expect(getLoginRedirectUrl(undefined)).toBe('/');
    expect(getLoginRedirectUrl('')).toBe('/');
    expect(getLoginRedirectUrl(12345)).toBe('/');
  });
});
