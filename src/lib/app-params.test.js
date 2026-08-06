import { describe, it, expect } from 'vitest';

// Define a minimal window object in global scope for Node test runner
globalThis.window = {
  location: {
    origin: 'https://rhgo.base44.app',
    href: 'https://rhgo.base44.app/',
    pathname: '/',
    search: '',
  },
  history: {
    replaceState: () => {},
  },
  document: {
    title: '',
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
};

import { getSafeRedirectUrl } from './app-params.js';

describe('getSafeRedirectUrl', () => {
  const fallback = '/';

  it('should allow same-origin absolute URLs', () => {
    const sameOriginUrl = 'https://rhgo.base44.app/settings?upgrade=success';
    expect(getSafeRedirectUrl(sameOriginUrl, fallback)).toBe(sameOriginUrl);
  });

  it('should allow safe relative paths starting with a single /', () => {
    const safePath = '/settings';
    expect(getSafeRedirectUrl(safePath, fallback)).toBe(safePath);

    const safePathWithParams = '/pricing?ref=test';
    expect(getSafeRedirectUrl(safePathWithParams, fallback)).toBe(safePathWithParams);
  });

  it('should block cross-origin absolute URLs and return fallback', () => {
    const maliciousUrl = 'https://malicious-site.com/settings';
    expect(getSafeRedirectUrl(maliciousUrl, fallback)).toBe(fallback);
  });

  it('should block protocol-relative and double slash bypass attempts', () => {
    // Protocol-relative / double slash bypasses
    expect(getSafeRedirectUrl('//malicious-site.com', fallback)).toBe(fallback);
    expect(getSafeRedirectUrl('///malicious-site.com', fallback)).toBe(fallback);
  });

  it('should block backslash and slash-backslash mixture bypass attempts', () => {
    expect(getSafeRedirectUrl('\\\\malicious-site.com', fallback)).toBe(fallback);
    expect(getSafeRedirectUrl('/\\malicious-site.com', fallback)).toBe(fallback);
    expect(getSafeRedirectUrl('\\/malicious-site.com', fallback)).toBe(fallback);
    expect(getSafeRedirectUrl('/\\/malicious-site.com', fallback)).toBe(fallback);
  });

  it('should handle null, undefined, or empty URLs by returning fallback', () => {
    expect(getSafeRedirectUrl(null, fallback)).toBe(fallback);
    expect(getSafeRedirectUrl(undefined, fallback)).toBe(fallback);
    expect(getSafeRedirectUrl('', fallback)).toBe(fallback);
  });
});
