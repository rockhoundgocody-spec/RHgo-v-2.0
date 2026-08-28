import { describe, expect, it } from 'vitest';
import { isValidImageHost } from '../../base44/functions/removeSpecimenBackground/imageValidation.ts';

describe('isValidImageHost', () => {
  it('allows authorized exact and subdomain hosts', () => {
    expect(isValidImageHost('https://base44.app/uploads/specimen1.jpg')).toBe(true);
    expect(isValidImageHost('https://cdn.base44.app/img.png')).toBe(true);
    expect(isValidImageHost('https://my-bucket.s3.amazonaws.com/rock.png')).toBe(true);
    expect(isValidImageHost('https://base44.com/assets/logo.png')).toBe(true);
  });

  it('rejects domain suffix spoofing attempts', () => {
    expect(isValidImageHost('https://evilbase44.app/malicious.jpg')).toBe(false);
    expect(isValidImageHost('https://fake-amazonaws.com/payload.png')).toBe(false);
    expect(isValidImageHost('https://attackerbase44.com/phish')).toBe(false);
  });

  it('rejects non-http/https protocols', () => {
    expect(isValidImageHost('javascript:alert(1)')).toBe(false);
    expect(isValidImageHost('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')).toBe(false);
    expect(isValidImageHost('file:///etc/passwd')).toBe(false);
  });

  it('handles invalid, empty, or non-string inputs safely', () => {
    expect(isValidImageHost('')).toBe(false);
    expect(isValidImageHost('not-a-valid-url')).toBe(false);
    expect(isValidImageHost(null)).toBe(false);
    expect(isValidImageHost(undefined)).toBe(false);
    expect(isValidImageHost(12345)).toBe(false);
  });
});
