import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from './urlValidation';

describe('isValidExternalUrl', () => {
  it('accepts valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com/permit')).toBe(true);
    expect(isValidExternalUrl('http://club.org/page?id=1')).toBe(true);
    expect(isValidExternalUrl('   https://sub.domain.com/path   ')).toBe(true);
  });

  it('rejects non-http/https protocols (DOM XSS vectors)', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('vbscript:msgbox("XSS")')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects invalid, null, undefined, or non-string input', () => {
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('  ')).toBe(false);
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl(12345)).toBe(false);
    expect(isValidExternalUrl('not-a-valid-url')).toBe(false);
  });
});
