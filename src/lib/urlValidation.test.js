import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from '../../base44/shared/urlValidation.ts';

describe('isValidExternalUrl', () => {
  it('allows valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com/permit')).toBe(true);
    expect(isValidExternalUrl('http://club.org/about')).toBe(true);
    expect(isValidExternalUrl('https://sub.domain.org/path?query=1#hash')).toBe(true);
  });

  it('blocks non-HTTP/HTTPS schemes', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('handles null, undefined, non-strings, and invalid URLs safely', () => {
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl(123)).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('not a url')).toBe(false);
  });
});
