import { describe, it, expect } from 'vitest';
import { isValidRedirectTarget } from './redirectValidation.ts';

describe('isValidRedirectTarget', () => {
  it('allows valid base44 app origins', () => {
    expect(isValidRedirectTarget('https://rhgo.base44.app/settings?upgrade=success')).toBe(true);
    expect(isValidRedirectTarget('https://rhgo2.base44.app/pricing')).toBe(true);
    expect(isValidRedirectTarget('https://sub.rhgo.base44.app/page')).toBe(true);
  });

  it('allows localhost and local IP origins for local testing', () => {
    expect(isValidRedirectTarget('http://localhost:3000/pricing')).toBe(true);
    expect(isValidRedirectTarget('http://127.0.0.1:5173/settings')).toBe(true);
  });

  it('rejects unapproved external domains', () => {
    expect(isValidRedirectTarget('https://attacker.com/malicious')).toBe(false);
    expect(isValidRedirectTarget('https://evil-base44.app.com/phish')).toBe(false);
    expect(isValidRedirectTarget('https://fakebase44.app/login')).toBe(false);
  });

  it('rejects non-http/https protocols', () => {
    expect(isValidRedirectTarget('javascript:alert(1)')).toBe(false);
    expect(isValidRedirectTarget('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('handles empty or non-string inputs safely', () => {
    expect(isValidRedirectTarget('')).toBe(false);
    expect(isValidRedirectTarget(null)).toBe(false);
    expect(isValidRedirectTarget(undefined)).toBe(false);
    expect(isValidRedirectTarget(12345)).toBe(false);
  });
});
