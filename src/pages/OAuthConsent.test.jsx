import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  globalThis.window = {
    self: 1,
    top: 1,
    location: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      pathname: '/oauth/consent',
      search: '',
      hash: '',
    },
    history: {
      replaceState: () => {},
    },
  };
  globalThis.document = {
    title: 'RockHound GO',
  };
});

describe('getSafeOAuthRedirectUrl', () => {
  let getSafeOAuthRedirectUrl;

  beforeAll(async () => {
    const mod = await import('./OAuthConsent');
    getSafeOAuthRedirectUrl = mod.getSafeOAuthRedirectUrl;
  });

  it('allows safe relative paths', () => {
    expect(getSafeOAuthRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeOAuthRedirectUrl('/mcp/success?code=xyz')).toBe('/mcp/success?code=xyz');
  });

  it('allows same-origin absolute URLs', () => {
    const sameOrigin = 'http://localhost:3000/oauth/callback?token=123';
    expect(getSafeOAuthRedirectUrl(sameOrigin)).toBe(sameOrigin);
  });

  it('blocks external HTTP and HTTPS open redirects', () => {
    expect(getSafeOAuthRedirectUrl('https://evil.com/phish')).toBe('/');
    expect(getSafeOAuthRedirectUrl('http://attacker.org/login')).toBe('/');
    expect(getSafeOAuthRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeOAuthRedirectUrl('/\\evil.com')).toBe('/');
  });

  it('blocks dangerous URI schemes', () => {
    expect(getSafeOAuthRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeOAuthRedirectUrl('JAVASCRIPT:alert(1)')).toBe('/');
    expect(getSafeOAuthRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
    expect(getSafeOAuthRedirectUrl('vbscript:msgbox(1)')).toBe('/');
    expect(getSafeOAuthRedirectUrl('file:///etc/passwd')).toBe('/');
    expect(getSafeOAuthRedirectUrl('about:blank')).toBe('/');
  });

  it('allows safe custom URI schemes for native AI clients', () => {
    expect(getSafeOAuthRedirectUrl('cursor://oauth/callback?code=abc')).toBe('cursor://oauth/callback?code=abc');
    expect(getSafeOAuthRedirectUrl('vscode://mcp/auth?session=123')).toBe('vscode://mcp/auth?session=123');
  });

  it('handles empty, null, and non-string inputs gracefully', () => {
    expect(getSafeOAuthRedirectUrl('')).toBe('/');
    expect(getSafeOAuthRedirectUrl(null)).toBe('/');
    expect(getSafeOAuthRedirectUrl(undefined, '/fallback')).toBe('/fallback');
    expect(getSafeOAuthRedirectUrl(12345)).toBe('/');
  });
});
