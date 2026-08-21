import { describe, it, expect, beforeAll } from 'vitest';

describe('getSafeRedirectUrl', () => {
  let getSafeRedirectUrl;

  beforeAll(async () => {
    // Setup window and document mock for testing browser environment
    const storageMap = new Map();
    globalThis.document = { title: 'RockHound GO' };
    globalThis.window = {
      location: {
        href: 'https://rhgo.base44.app/login',
        origin: 'https://rhgo.base44.app',
        pathname: '/login',
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

    const mod = await import('./app-params.js');
    getSafeRedirectUrl = mod.getSafeRedirectUrl;
  });

  it('allows safe relative paths', () => {
    expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('/settings?upgrade=success')).toBe('/settings?upgrade=success');
    expect(getSafeRedirectUrl('/specimens#top')).toBe('/specimens#top');
  });

  it('allows same-origin absolute URLs and converts them to relative paths', () => {
    expect(getSafeRedirectUrl('https://rhgo.base44.app/settings')).toBe('/settings');
    expect(getSafeRedirectUrl('https://rhgo.base44.app/map?filter=active')).toBe('/map?filter=active');
  });

  it('blocks cross-origin absolute URLs and returns fallback', () => {
    expect(getSafeRedirectUrl('https://attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('https://evil-rhgo.base44.app/phish')).toBe('/');
    expect(getSafeRedirectUrl('http://phishing.org/login')).toBe('/');
  });

  it('blocks protocol-relative URLs (//evil.com)', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('//rhgo.base44.app')).toBe('/');
  });

  it('blocks backslash evasion attempts (/\\evil.com)', () => {
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('\\evil.com')).toBe('/');
  });

  it('blocks multiple slash evasions (///evil.com)', () => {
    expect(getSafeRedirectUrl('///evil.com')).toBe('/');
  });

  it('blocks non-http/https protocols', () => {
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
  });

  it('handles null, undefined, non-string, or empty input safely', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl(123)).toBe('/');
    expect(getSafeRedirectUrl({}, '/custom-fallback')).toBe('/custom-fallback');
  });
});
