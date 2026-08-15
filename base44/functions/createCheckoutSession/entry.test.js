import { describe, it, expect } from 'vitest';
import { isValidRedirectTarget } from './redirectValidation.ts';

describe('isValidRedirectTarget', () => {
  it('allows valid local and production URLs', () => {
    expect(isValidRedirectTarget('http://localhost:5173/pricing?success=true')).toBe(true);
    expect(isValidRedirectTarget('http://127.0.0.1:3000/cancel')).toBe(true);
    expect(isValidRedirectTarget('https://rockhoundgo.com/pricing')).toBe(true);
    expect(isValidRedirectTarget('https://app.rockhoundgo.com/pricing')).toBe(true);
    expect(isValidRedirectTarget('https://rhgo.base44.app/checkout/success')).toBe(true);
    expect(isValidRedirectTarget('https://rhgo2.base44.app/checkout/cancel')).toBe(true);
    expect(isValidRedirectTarget('https://sub.rhgo.base44.app/ok')).toBe(true);
  });

  it('rejects untrusted third-party domains', () => {
    expect(isValidRedirectTarget('https://evil.com')).toBe(false);
    expect(isValidRedirectTarget('https://attacker.com/login')).toBe(false);
    expect(isValidRedirectTarget('https://fake-base44.app.evil.com')).toBe(false);
    expect(isValidRedirectTarget('https://rockhoundgo.com.evil.com')).toBe(false);
  });

  it('rejects invalid or dangerous non-HTTP protocols and malformed inputs', () => {
    expect(isValidRedirectTarget('javascript:alert(1)')).toBe(false);
    expect(isValidRedirectTarget('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidRedirectTarget('not a url')).toBe(false);
    expect(isValidRedirectTarget('')).toBe(false);
    expect(isValidRedirectTarget(null)).toBe(false);
    expect(isValidRedirectTarget(undefined)).toBe(false);
  });
});
