import { assertEquals } from 'jsr:@std/assert@1';
import { isValidImageUrl } from './imageUrlValidation.ts';

Deno.test('isValidImageUrl: accepts valid image URLs on authorized domains', () => {
  assertEquals(isValidImageUrl('https://base44.app/uploads/specimen.jpg'), true);
  assertEquals(isValidImageUrl('https://sub.base44.app/images/photo.png'), true);
  assertEquals(isValidImageUrl('https://base44.com/photo.webp'), true);
  assertEquals(isValidImageUrl('https://s3.amazonaws.com/bucket/key.jpg'), true);
});

Deno.test('isValidImageUrl: rejects domain suffix spoofing attempts', () => {
  assertEquals(isValidImageUrl('https://evilbase44.app/photo.jpg'), false);
  assertEquals(isValidImageUrl('https://fake-base44.com/photo.jpg'), false);
  assertEquals(isValidImageUrl('https://notamazonaws.com/photo.jpg'), false);
});

Deno.test('isValidImageUrl: rejects dangerous or non-HTTP protocols', () => {
  assertEquals(isValidImageUrl('javascript:alert(1)'), false);
  assertEquals(isValidImageUrl('file:///etc/passwd'), false);
  assertEquals(isValidImageUrl('data:image/png;base64,iVBORw0KGgo='), false);
});

Deno.test('isValidImageUrl: handles invalid inputs gracefully', () => {
  assertEquals(isValidImageUrl(null), false);
  assertEquals(isValidImageUrl(undefined), false);
  assertEquals(isValidImageUrl(''), false);
  assertEquals(isValidImageUrl('not-a-url'), false);
});
