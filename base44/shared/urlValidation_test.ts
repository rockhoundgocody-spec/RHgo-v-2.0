import { assertEquals } from 'jsr:@std/assert@1';
import { isValidExternalUrl } from './urlValidation.ts';

Deno.test('isValidExternalUrl: accepts valid http and https URLs', () => {
  assertEquals(isValidExternalUrl('https://example.com'), true);
  assertEquals(isValidExternalUrl('http://club.org/path'), true);
});

Deno.test('isValidExternalUrl: rejects dangerous schemes', () => {
  assertEquals(isValidExternalUrl('javascript:alert(1)'), false);
  assertEquals(isValidExternalUrl('data:text/html,test'), false);
  assertEquals(isValidExternalUrl('file:///etc/passwd'), false);
});

Deno.test('isValidExternalUrl: handles invalid and non-URL inputs gracefully', () => {
  assertEquals(isValidExternalUrl(null), false);
  assertEquals(isValidExternalUrl(undefined), false);
  assertEquals(isValidExternalUrl(''), false);
  assertEquals(isValidExternalUrl('invalid'), false);
});
