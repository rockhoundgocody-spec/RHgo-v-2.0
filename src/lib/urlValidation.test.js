import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from './urlValidation.js';

describe('isValidExternalUrl', () => {
  it('accepts valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com/permit')).toBe(true);
    expect(isValidExternalUrl('http://club.org/page?id=123')).toBe(true);
  });

  it('rejects dangerous schemes and XSS vectors', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('JAVASCRIPT:alert("xss")')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('handles null, undefined, and non-URL strings gracefully', () => {
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('invalid-url')).toBe(false);
    expect(isValidExternalUrl('/relative/path')).toBe(false);
  });
});
