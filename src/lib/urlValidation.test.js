import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from '../../base44/shared/urlValidation.ts';

describe('isValidExternalUrl', () => {
  it('accepts valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com/permit')).toBe(true);
    expect(isValidExternalUrl('http://club.org')).toBe(true);
  });

  it('rejects javascript: and data: XSS schemes', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('javascript:eval(atob("..."))')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('handles null, undefined, empty, and malformed URLs gracefully', () => {
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('invalid-url')).toBe(false);
  });
});
