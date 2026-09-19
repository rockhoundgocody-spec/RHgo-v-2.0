import { describe, it, expect, beforeAll } from 'vitest';

let validateAndGetSafeConsentRedirect;

beforeAll(async () => {
  globalThis.window = {
    location: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      pathname: '/consent',
      search: '?ctx=123',
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
    self: {},
    top: {},
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;
  globalThis.document = {
    title: 'RockHound GO',
  };

  const mod = await import('./OAuthConsent');
  validateAndGetSafeConsentRedirect = mod.validateAndGetSafeConsentRedirect;
});

describe('validateAndGetSafeConsentRedirect', () => {
  it('allows safe http, https, and relative URLs', () => {
    expect(validateAndGetSafeConsentRedirect('https://example.com/oauth/callback')).toBe(
      'https://example.com/oauth/callback'
    );
    expect(validateAndGetSafeConsentRedirect('http://localhost:3000/callback')).toBe(
      'http://localhost:3000/callback'
    );
    expect(validateAndGetSafeConsentRedirect('/dashboard')).toBe('/dashboard');
  });

  it('allows valid custom AI client schemes (e.g. cursor://)', () => {
    expect(validateAndGetSafeConsentRedirect('cursor://mcp-auth/callback?code=xyz')).toBe(
      'cursor://mcp-auth/callback?code=xyz'
    );
    expect(validateAndGetSafeConsentRedirect('vscode://mcp-auth/callback?token=123')).toBe(
      'vscode://mcp-auth/callback?token=123'
    );
  });

  it('rejects dangerous protocols (javascript:, data:, file:, vbscript:, about:)', () => {
    expect(() => validateAndGetSafeConsentRedirect('javascript:alert(1)')).toThrow(
      'Insecure redirect protocol rejected'
    );
    expect(() => validateAndGetSafeConsentRedirect('JAVASCRIPT:alert(document.cookie)')).toThrow(
      'Insecure redirect protocol rejected'
    );
    expect(() => validateAndGetSafeConsentRedirect('data:text/html,<script>alert(1)</script>')).toThrow(
      'Insecure redirect protocol rejected'
    );
    expect(() => validateAndGetSafeConsentRedirect('file:///etc/passwd')).toThrow(
      'Insecure redirect protocol rejected'
    );
    expect(() => validateAndGetSafeConsentRedirect('vbscript:msgbox(1)')).toThrow(
      'Insecure redirect protocol rejected'
    );
    expect(() => validateAndGetSafeConsentRedirect('about:blank')).toThrow(
      'Insecure redirect protocol rejected'
    );
  });

  it('rejects null, undefined, empty, or non-string inputs', () => {
    expect(() => validateAndGetSafeConsentRedirect(null)).toThrow('Invalid redirect response');
    expect(() => validateAndGetSafeConsentRedirect(undefined)).toThrow('Invalid redirect response');
    expect(() => validateAndGetSafeConsentRedirect('')).toThrow('Invalid redirect response');
    expect(() => validateAndGetSafeConsentRedirect(12345)).toThrow('Invalid redirect response');
  });
});
