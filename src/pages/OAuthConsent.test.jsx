import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSafeRedirectUrl } from '@/lib/app-params';

describe('OAuthConsent redirect URL sanitization', () => {
  let originalGlobalWindow;

  beforeEach(() => {
    vi.resetModules();
    originalGlobalWindow = globalThis.window;
    globalThis.window = {
      location: {
        origin: 'https://rhgo.base44.app',
        pathname: '/oauth/consent',
        search: '?ctx=test-ctx',
        href: 'https://rhgo.base44.app/oauth/consent?ctx=test-ctx',
      },
    };
  });

  afterEach(() => {
    globalThis.window = originalGlobalWindow;
  });

  it('validates HTTP/HTTPS redirect URLs against current origin', () => {
    // Same origin HTTP/HTTPS should be preserved
    const sameOriginUrl = 'https://rhgo.base44.app/dashboard';
    expect(getSafeRedirectUrl(sameOriginUrl)).toBe(sameOriginUrl);

    // Relative path should be preserved
    const relativeUrl = '/dashboard';
    expect(getSafeRedirectUrl(relativeUrl)).toBe(relativeUrl);

    // Cross origin HTTP/HTTPS should be rejected and return default '/'
    const evilUrl = 'https://evil.com/phish';
    expect(getSafeRedirectUrl(evilUrl)).toBe('/');

    // Protocol-relative URL should be rejected
    const protoRelativeUrl = '//evil.com';
    expect(getSafeRedirectUrl(protoRelativeUrl)).toBe('/');
  });

  it('correctly identifies custom scheme vs http/https protocol', () => {
    const isHttpOrHttps = (url) => /^https?:/i.test(url);

    expect(isHttpOrHttps('https://rhgo.base44.app/auth')).toBe(true);
    expect(isHttpOrHttps('http://localhost:3000/auth')).toBe(true);
    expect(isHttpOrHttps('cursor://oauth/callback')).toBe(false);
    expect(isHttpOrHttps('vscode://oauth/callback')).toBe(false);
  });
});
