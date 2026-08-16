import { describe, it, expect } from 'vitest';
import { isValidRedirectTarget } from './redirectValidation.ts';

describe('isValidRedirectTarget', () => {
  it('allows valid local and application URLs', () => {
    expect(isValidRedirectTarget('http://localhost:3000/success')).toBe(true);
    expect(isValidRedirectTarget('http://127.0.0.1:5173/cancel')).toBe(true);
    expect(isValidRedirectTarget('https://rhgo.base44.app/pricing')).toBe(true);
    expect(isValidRedirectTarget('https://rhgo2.base44.app/checkout/success')).toBe(true);
    expect(isValidRedirectTarget('https://my-subdomain.base44.app/callback')).toBe(true);
  });

  it('rejects external or unapproved domains', () => {
    expect(isValidRedirectTarget('https://evil.com')).toBe(false);
    expect(isValidRedirectTarget('https://phishing.org/login')).toBe(false);
    expect(isValidRedirectTarget('https://base44.app.evil.com/fake')).toBe(false);
    expect(isValidRedirectTarget('https://notbase44.app/')).toBe(false);
  });

  it('rejects non-http/https protocols', () => {
    expect(isValidRedirectTarget('javascript:alert(1)')).toBe(false);
    expect(isValidRedirectTarget('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidRedirectTarget('file:///etc/passwd')).toBe(false);
  });

  it('handles invalid or empty inputs safely', () => {
    expect(isValidRedirectTarget('')).toBe(false);
    expect(isValidRedirectTarget(null)).toBe(false);
    expect(isValidRedirectTarget(undefined)).toBe(false);
    expect(isValidRedirectTarget('invalid-url-string')).toBe(false);
  });
});
