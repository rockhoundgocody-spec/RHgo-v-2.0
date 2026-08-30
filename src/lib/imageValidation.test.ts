import { describe, it, expect } from 'vitest';
import { isValidUploadedImageUrl } from '../../base44/functions/removeSpecimenBackground/imageValidation.ts';

describe('isValidUploadedImageUrl', () => {
  it('allows valid exact base44/aws domains and subdomains', () => {
    expect(isValidUploadedImageUrl('https://rhgo.base44.app/uploads/specimen.jpg')).toBe(true);
    expect(isValidUploadedImageUrl('https://base44.com/photo.png')).toBe(true);
    expect(isValidUploadedImageUrl('https://s3.amazonaws.com/bucket/image.png')).toBe(true);
    expect(isValidUploadedImageUrl('https://sub.s3.amazonaws.com/image.png')).toBe(true);
  });

  it('rejects domain suffix spoofing attacks', () => {
    expect(isValidUploadedImageUrl('https://evilbase44.app/phish.jpg')).toBe(false);
    expect(isValidUploadedImageUrl('https://fakebase44.com/phish.jpg')).toBe(false);
    expect(isValidUploadedImageUrl('https://evilamazonaws.com/phish.jpg')).toBe(false);
    expect(isValidUploadedImageUrl('https://attackerbase44.app.com/phish.jpg')).toBe(false);
  });

  it('rejects invalid or unsafe protocols', () => {
    expect(isValidUploadedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUploadedImageUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidUploadedImageUrl('ftp://base44.app/image.jpg')).toBe(false);
  });

  it('handles empty or non-string inputs safely', () => {
    expect(isValidUploadedImageUrl('')).toBe(false);
    expect(isValidUploadedImageUrl(null as unknown as string)).toBe(false);
    expect(isValidUploadedImageUrl(undefined as unknown as string)).toBe(false);
    expect(isValidUploadedImageUrl(12345 as unknown as string)).toBe(false);
  });
});
