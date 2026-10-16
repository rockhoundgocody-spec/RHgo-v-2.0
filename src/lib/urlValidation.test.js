import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from './urlValidation';

describe('isValidExternalUrl', () => {
  it('returns true for valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com/permit')).toBe(true);
    expect(isValidExternalUrl('http://blm.gov/permits?id=123')).toBe(true);
    expect(isValidExternalUrl('https://sub.domain.org/path/to/file.html#section')).toBe(true);
  });

  it('rejects dangerous protocols such as javascript:, data:, vbscript:', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('JAVASCRIPT:alert(1)')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('vbscript:msgbox("XSS")')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects invalid inputs, empty strings, and non-string types', () => {
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('   ')).toBe(false);
    expect(isValidExternalUrl('not-a-url')).toBe(false);
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl(12345)).toBe(false);
    expect(isValidExternalUrl({})).toBe(false);
  });
});
