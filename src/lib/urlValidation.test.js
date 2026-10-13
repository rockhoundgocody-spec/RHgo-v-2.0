import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from '../../base44/shared/urlValidation.ts';

describe('isValidExternalUrl', () => {
  it('returns true for valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com')).toBe(true);
    expect(isValidExternalUrl('http://example.com/page?query=1#hash')).toBe(true);
    expect(isValidExternalUrl('https://sub.domain.co.uk/path')).toBe(true);
  });

  it('rejects XSS vectors such as javascript: and data: schemes', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('javascript:/*--></title></style></textarea></script><svg/onload=alert(1)>')).toBe(false);
    expect(isValidExternalUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
    expect(isValidExternalUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('rejects relative URLs, non-web schemes, and invalid strings', () => {
    expect(isValidExternalUrl('/relative/path')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isValidExternalUrl('not-a-url')).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('   ')).toBe(false);
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
  });
});
