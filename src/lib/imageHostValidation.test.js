import { describe, expect, it } from 'vitest';
import { isValidImageHost } from '../../base44/functions/removeSpecimenBackground/imageHostValidation.ts';

describe('isValidImageHost', () => {
  it('allows valid exact domain matches', () => {
    expect(isValidImageHost('https://base44.app/image.png')).toBe(true);
    expect(isValidImageHost('https://base44.com/assets/rock.jpg')).toBe(true);
    expect(isValidImageHost('https://amazonaws.com/bucket/photo.webp')).toBe(true);
  });

  it('allows valid subdomains', () => {
    expect(isValidImageHost('https://rhgo.base44.app/specimens/123.jpg')).toBe(true);
    expect(isValidImageHost('https://s3.us-west-2.amazonaws.com/mybucket/file.png')).toBe(true);
    expect(isValidImageHost('https://cdn.sub.base44.com/img.png')).toBe(true);
  });

  it('rejects domain suffix spoofing attempts', () => {
    expect(isValidImageHost('https://evilbase44.app/phish')).toBe(false);
    expect(isValidImageHost('https://fakebase44.com/malware')).toBe(false);
    expect(isValidImageHost('https://evilamazonaws.com/exploit')).toBe(false);
    expect(isValidImageHost('https://notbase44.app.com/test')).toBe(false);
  });

  it('rejects unapproved external domains', () => {
    expect(isValidImageHost('https://google.com/logo.png')).toBe(false);
    expect(isValidImageHost('https://attacker.com/malicious.jpg')).toBe(false);
  });

  it('rejects non-http/https schemes', () => {
    expect(isValidImageHost('javascript:alert(1)')).toBe(false);
    expect(isValidImageHost('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
    expect(isValidImageHost('file:///etc/passwd')).toBe(false);
  });

  it('handles invalid or empty inputs gracefully', () => {
    expect(isValidImageHost('')).toBe(false);
    expect(isValidImageHost(null)).toBe(false);
    expect(isValidImageHost(undefined)).toBe(false);
    expect(isValidImageHost(12345)).toBe(false);
    expect(isValidImageHost('not-a-url')).toBe(false);
  });
});
