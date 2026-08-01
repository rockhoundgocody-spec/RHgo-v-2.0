import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getSafeRedirectUrl } from './app-params.js';

describe('getSafeRedirectUrl', () => {
  const originalWindow = globalThis.window;

  beforeAll(() => {
    // Mock the window object
    globalThis.window = {
      location: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/login',
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
    };
  });

  afterAll(() => {
    globalThis.window = originalWindow;
  });

  it('should allow safe relative paths', () => {
    expect(getSafeRedirectUrl('/onboarding')).toBe('/onboarding');
    expect(getSafeRedirectUrl('/')).toBe('/');
    expect(getSafeRedirectUrl('/dashboard?user=test#profile')).toBe('/dashboard?user=test#profile');
  });

  it('should allow same-origin absolute URLs and return their relative parts', () => {
    expect(getSafeRedirectUrl('http://localhost:3000/onboarding')).toBe('/onboarding');
    expect(getSafeRedirectUrl('http://localhost:3000/')).toBe('/');
  });

  it('should reject and fall back for external absolute URLs', () => {
    expect(getSafeRedirectUrl('https://attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('http://example.com/some/path')).toBe('/');
    expect(getSafeRedirectUrl('https://attacker.com/onboarding', '/custom-fallback')).toBe('/custom-fallback');
  });

  it('should reject protocol-relative URLs', () => {
    expect(getSafeRedirectUrl('//attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('//google.com/test')).toBe('/');
  });

  it('should reject backslash-obfuscated relative URLs', () => {
    expect(getSafeRedirectUrl('/\\attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\example.com/test')).toBe('/');
  });

  it('should gracefully handle null, undefined, empty, or non-string inputs', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl(123)).toBe('/');
    expect(getSafeRedirectUrl({})).toBe('/');
  });
});
