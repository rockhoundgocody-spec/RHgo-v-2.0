import { vi, describe, it, expect, beforeAll } from 'vitest';

describe('getSafeRedirectUrl', () => {
  let getSafeRedirectUrl;

  beforeAll(async () => {
    // Configure and define global window/document to bypass ESM evaluation constraints
    globalThis.window = {
      location: {
        origin: 'https://rhgo.base44.app',
        href: 'https://rhgo.base44.app/login',
        search: '',
        pathname: '/login',
        hash: '',
      },
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      history: {
        replaceState: vi.fn(),
      }
    };
    globalThis.document = {
      title: 'RockHound-GO',
    };

    // Load module dynamically to bypass ESM hoisting/side-effect constraints
    const module = await import('./app-params.js');
    getSafeRedirectUrl = module.getSafeRedirectUrl;
  });

  it('should allow safe relative paths starting with a single slash', () => {
    expect(getSafeRedirectUrl('/onboarding')).toBe('/onboarding');
    expect(getSafeRedirectUrl('/settings?upgrade=success')).toBe('/settings?upgrade=success');
    expect(getSafeRedirectUrl('/')).toBe('/');
  });

  it('should allow same-origin absolute URLs', () => {
    expect(getSafeRedirectUrl('https://rhgo.base44.app/settings')).toBe('https://rhgo.base44.app/settings');
  });

  it('should reject different origin absolute URLs and fallback to /', () => {
    expect(getSafeRedirectUrl('https://evil.com')).toBe('/');
    expect(getSafeRedirectUrl('http://evil.com/somepath')).toBe('/');
  });

  it('should reject protocol-relative and other bypass attempts starting with slashes/backslashes', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('///evil.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('\\\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('\\/evil.com')).toBe('/');
    expect(getSafeRedirectUrl('\\evil.com')).toBe('/');
  });

  it('should reject invalid or non-string inputs and fallback to /', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl({})).toBe('/');
  });
});
