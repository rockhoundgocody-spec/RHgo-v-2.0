import { describe, it, expect, beforeAll } from 'vitest';

let getSafeRedirectUrl;

beforeAll(async () => {
  globalThis.document = {
    title: 'RockHound GO',
  };
  globalThis.window = {
    location: {
      origin: 'https://rhgo.base44.app',
      href: 'https://rhgo.base44.app/explore',
      search: '',
      pathname: '/explore',
      hash: '',
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    history: {
      replaceState: () => {},
    },
  };

  const module = await import('./app-params.js');
  getSafeRedirectUrl = module.getSafeRedirectUrl;
});

describe('getSafeRedirectUrl', () => {
  it('allows valid relative paths starting with /', () => {
    expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('/explore?tab=map#section')).toBe('/explore?tab=map#section');
  });

  it('allows same-origin absolute URLs', () => {
    expect(getSafeRedirectUrl('https://rhgo.base44.app/settings')).toBe('/settings');
  });

  it('rejects external domain absolute URLs', () => {
    expect(getSafeRedirectUrl('https://evil-attacker.com/malicious')).toBe('/');
    expect(getSafeRedirectUrl('https://phishing.app/login')).toBe('/');
  });

  it('rejects protocol-relative bypasses (//)', () => {
    expect(getSafeRedirectUrl('//evil.com/phish')).toBe('/');
    expect(getSafeRedirectUrl('//rhgo.base44.app.evil.com')).toBe('/');
  });

  it('rejects backslash bypasses (\\, /\\, ///)', () => {
    expect(getSafeRedirectUrl('\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('///evil.com')).toBe('/');
  });

  it('rejects javascript: and data: URIs', () => {
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
  });

  it('returns custom fallback when provided', () => {
    expect(getSafeRedirectUrl('https://evil.com', '/fallback')).toBe('/fallback');
    expect(getSafeRedirectUrl(null, '/home')).toBe('/home');
  });

  it('handles null, undefined, and non-string inputs gracefully', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl(12345)).toBe('/');
  });
});
