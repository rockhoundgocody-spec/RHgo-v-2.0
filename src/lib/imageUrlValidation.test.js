import { describe, it, expect } from 'vitest';
import { isValidImageUrl } from '../../base44/shared/imageUrlValidation.ts';

describe('isValidImageUrl', () => {
  it('allows valid URLs on exact allowed domains', () => {
    expect(isValidImageUrl('https://base44.app/images/specimen.jpg')).toBe(true);
    expect(isValidImageUrl('https://base44.com/photos/1.png')).toBe(true);
    expect(isValidImageUrl('https://amazonaws.com/bucket/key.webp')).toBe(true);
  });

  it('allows valid URLs on allowed subdomains', () => {
    expect(isValidImageUrl('https://sub.base44.app/images/specimen.jpg')).toBe(true);
    expect(isValidImageUrl('https://s3.us-west-2.amazonaws.com/bucket/key.webp')).toBe(true);
  });

  it('blocks domain suffix spoofing attempts', () => {
    expect(isValidImageUrl('https://evilbase44.app/image.jpg')).toBe(false);
    expect(isValidImageUrl('https://fake-base44.com/image.jpg')).toBe(false);
    expect(isValidImageUrl('https://notamazonaws.com/image.jpg')).toBe(false);
  });

  it('blocks non-HTTP protocols', () => {
    expect(isValidImageUrl('javascript:alert(1)')).toBe(false);
    expect(isValidImageUrl('file:///etc/passwd')).toBe(false);
    expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
  });

  it('handles null, undefined, non-string, and malformed URLs gracefully', () => {
    expect(isValidImageUrl(null)).toBe(false);
    expect(isValidImageUrl(undefined)).toBe(false);
    expect(isValidImageUrl(123)).toBe(false);
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl('not-a-url')).toBe(false);
  });
});
