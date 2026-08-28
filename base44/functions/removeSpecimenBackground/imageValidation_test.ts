import { assertEquals } from 'jsr:@std/assert@1';
import { isValidImageHost } from './imageValidation.ts';

Deno.test('isValidImageHost: allows authorized exact and subdomain hosts', () => {
  assertEquals(isValidImageHost('https://base44.app/uploads/specimen1.jpg'), true);
  assertEquals(isValidImageHost('https://cdn.base44.app/img.png'), true);
  assertEquals(isValidImageHost('https://my-bucket.s3.amazonaws.com/rock.png'), true);
  assertEquals(isValidImageHost('https://base44.com/assets/logo.png'), true);
});

Deno.test('isValidImageHost: rejects domain suffix spoofing attempts', () => {
  assertEquals(isValidImageHost('https://evilbase44.app/malicious.jpg'), false);
  assertEquals(isValidImageHost('https://fake-amazonaws.com/payload.png'), false);
  assertEquals(isValidImageHost('https://attackerbase44.com/phish'), false);
});

Deno.test('isValidImageHost: rejects non-http/https protocols', () => {
  assertEquals(isValidImageHost('javascript:alert(1)'), false);
  assertEquals(isValidImageHost('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), false);
  assertEquals(isValidImageHost('file:///etc/passwd'), false);
});

Deno.test('isValidImageHost: handles invalid, empty, or non-string inputs safely', () => {
  assertEquals(isValidImageHost(''), false);
  assertEquals(isValidImageHost('not-a-valid-url'), false);
  assertEquals(isValidImageHost(null as unknown as string), false);
  assertEquals(isValidImageHost(undefined as unknown as string), false);
  assertEquals(isValidImageHost(12345 as unknown as string), false);
});
