import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from '../../base44/shared/urlValidation.ts';

describe('isValidExternalUrl', () => {
  it('allows valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com')).toBe(true);
    expect(isValidExternalUrl('http://club.org/page')).toBe(true);
    expect(isValidExternalUrl('https://subdomain.domain.co.uk/path?query=1#hash')).toBe(true);
  });

  it('rejects malicious or non-HTTP schemes (preventing DOM XSS)', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isValidExternalUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('rejects relative, empty, malformed, or non-string inputs', () => {
    expect(isValidExternalUrl('/relative/path')).toBe(false);
    expect(isValidExternalUrl('relative/path')).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('   ')).toBe(false);
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl(123)).toBe(false);
  });
});
