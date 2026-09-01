import { describe, it, expect, beforeAll } from 'vitest';

let getSafeConsentRedirectUrl;

beforeAll(async () => {
  globalThis.window = {
    self: {},
    top: {},
    location: {
      search: '',
      href: 'http://localhost:3000',
      pathname: '/',
      origin: 'http://localhost:3000',
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
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;
  globalThis.document = {
    title: 'RockHound GO',
  };

  const mod = await import('./OAuthConsent');
  getSafeConsentRedirectUrl = mod.getSafeConsentRedirectUrl;
});

describe('getSafeConsentRedirectUrl', () => {
  const currentOrigin = 'http://localhost:3000';

  it('allows same-origin relative paths', () => {
    expect(getSafeConsentRedirectUrl('/oauth/callback', currentOrigin)).toBe('/oauth/callback');
    expect(getSafeConsentRedirectUrl('/callback?code=abc#state=123', currentOrigin)).toBe('/callback?code=abc#state=123');
  });

  it('allows same-origin absolute URLs', () => {
    const safeUrl = 'http://localhost:3000/oauth/callback?code=123';
    expect(getSafeConsentRedirectUrl(safeUrl, currentOrigin)).toBe(safeUrl);
  });

  it('blocks external HTTP/HTTPS URLs (open redirect vectors)', () => {
    expect(getSafeConsentRedirectUrl('https://evil.com/phish', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('http://attacker.org/oauth/callback', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('//evil.com/phish', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('/\\evil.com', currentOrigin)).toBeNull();
  });

  it('blocks dangerous pseudo-protocol schemes', () => {
    expect(getSafeConsentRedirectUrl('javascript:alert(1)', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('data:text/html,<script>alert(1)</script>', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('file:///etc/passwd', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('vbscript:msgbox(1)', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('blob:http://localhost:3000/uuid', currentOrigin)).toBeNull();
  });

  it('allows safe custom desktop client schemes', () => {
    expect(getSafeConsentRedirectUrl('cursor://mcp/callback?code=123', currentOrigin)).toBe('cursor://mcp/callback?code=123');
    expect(getSafeConsentRedirectUrl('vscode://mcp/callback', currentOrigin)).toBe('vscode://mcp/callback');
  });

  it('handles null, undefined, empty, and non-string inputs gracefully', () => {
    expect(getSafeConsentRedirectUrl('', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl(null, currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl(undefined, currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl(12345, currentOrigin)).toBeNull();
  });

  it('blocks URLs with embedded control characters', () => {
    expect(getSafeConsentRedirectUrl('/\t//evil.com', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('/\n//evil.com', currentOrigin)).toBeNull();
    expect(getSafeConsentRedirectUrl('/\u0000//evil.com', currentOrigin)).toBeNull();
  });
});
