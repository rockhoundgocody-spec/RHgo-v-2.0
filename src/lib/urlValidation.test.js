import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from './urlValidation';

describe('isValidExternalUrl', () => {
  it('allows valid http and https URLs', () => {
    expect(isValidExternalUrl('https://example.com/permit')).toBe(true);
    expect(isValidExternalUrl('http://clubsite.org/index.html')).toBe(true);
    expect(isValidExternalUrl('https://sub.domain.co.uk/path?query=1#hash')).toBe(true);
  });

  it('blocks javascript: DOM XSS vectors', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('javascript:confirm(document.cookie)')).toBe(false);
    expect(isValidExternalUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });

  it('blocks data: and other unsafe URI schemes', () => {
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isValidExternalUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('handles empty, null, undefined, and non-string values gracefully', () => {
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl('   ')).toBe(false);
    expect(isValidExternalUrl(12345)).toBe(false);
  });

  it('handles invalid URL strings without throwing errors', () => {
    expect(isValidExternalUrl('not-a-url')).toBe(false);
    expect(isValidExternalUrl('http://')).toBe(false);
  });
});