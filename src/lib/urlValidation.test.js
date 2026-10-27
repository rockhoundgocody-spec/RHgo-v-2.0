import { describe, it, expect } from 'vitest';
import { isValidExternalUrl } from '../../base44/shared/urlValidation.ts';

describe('isValidExternalUrl', () => {
  it('allows http and https URLs', () => {
    expect(isValidExternalUrl('http://example.com/permit')).toBe(true);
    expect(isValidExternalUrl('https://example.com/permit?id=123')).toBe(true);
    expect(isValidExternalUrl('  https://state.gov/permits  ')).toBe(true);
  });

  it('rejects javascript, data, and vbscript URLs', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalUrl('javascript:confirm(document.cookie)')).toBe(false);
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidExternalUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('rejects relative, empty, and invalid URLs', () => {
    expect(isValidExternalUrl('/relative/path')).toBe(false);
    expect(isValidExternalUrl('not-a-url')).toBe(false);
    expect(isValidExternalUrl('')).toBe(false);
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
  });
});
