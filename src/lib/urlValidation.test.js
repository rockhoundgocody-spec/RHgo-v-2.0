import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from '../../base44/shared/urlValidation.ts';

describe('isValidExternalUrl', () => {
  it('accepts valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com')).toBe(true);
    expect(isValidExternalUrl('http://club.org/page?query=1')).toBe(true);
  });

  it('rejects dangerous protocols', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('JAVASCRIPT:alert(1)')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('handles null, undefined, non-string, and relative inputs gracefully', () => {
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('/clubs')).toBe(false);
    expect(isValidExternalUrl('not-a-url')).toBe(false);
  });
});
