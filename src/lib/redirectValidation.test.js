import { describe, it, expect } from 'vitest';
import { isValidRedirectTarget } from '../../base44/functions/createCheckoutSession/redirectValidation';

describe('isValidRedirectTarget', () => {
  it('allows valid local and base44 domains', () => {
    expect(isValidRedirectTarget('http://localhost:5173/pricing?success=true')).toBe(true);
    expect(isValidRedirectTarget('http://127.0.0.1:3000/cancel')).toBe(true);
    expect(isValidRedirectTarget('https://rhgo.base44.app/pricing/success')).toBe(true);
    expect(isValidRedirectTarget('https://rhgo2.base44.app/pricing/cancel')).toBe(true);
    expect(isValidRedirectTarget('https://sub.domain.base44.app/checkout')).toBe(true);
  });

  it('rejects disallowed external domains and open redirect attempts', () => {
    expect(isValidRedirectTarget('https://evil.com/phishing')).toBe(false);
    expect(isValidRedirectTarget('https://fake-base44.app.attacker.com')).toBe(false);
    expect(isValidRedirectTarget('https://notbase44.app')).toBe(false);
    expect(isValidRedirectTarget('javascript:alert(1)')).toBe(false);
    expect(isValidRedirectTarget('//evil.com/path')).toBe(false);
    expect(isValidRedirectTarget('')).toBe(false);
    expect(isValidRedirectTarget(null)).toBe(false);
  });
});
