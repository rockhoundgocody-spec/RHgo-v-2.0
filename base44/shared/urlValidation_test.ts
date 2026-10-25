import { assertEquals } from 'jsr:@std/assert@1';
import { isValidExternalUrl } from './urlValidation.ts';

Deno.test('isValidExternalUrl: accepts valid http and https URLs', () => {
  assertEquals(isValidExternalUrl('https://example.com/permit'), true);
  assertEquals(isValidExternalUrl('http://club.org/page?id=123'), true);
});

Deno.test('isValidExternalUrl: rejects dangerous schemes and XSS vectors', () => {
  assertEquals(isValidExternalUrl('javascript:alert(1)'), false);
  assertEquals(isValidExternalUrl('JAVASCRIPT:alert("xss")'), false);
  assertEquals(isValidExternalUrl('data:text/html,<script>alert(1)</script>'), false);
  assertEquals(isValidExternalUrl('file:///etc/passwd'), false);
  assertEquals(isValidExternalUrl('vbscript:msgbox(1)'), false);
});

Deno.test('isValidExternalUrl: handles null, undefined, empty and invalid URLs gracefully', () => {
  assertEquals(isValidExternalUrl(null), false);
  assertEquals(isValidExternalUrl(undefined), false);
  assertEquals(isValidExternalUrl(''), false);
  assertEquals(isValidExternalUrl('not-a-valid-url'), false);
  assertEquals(isValidExternalUrl('/relative/path'), false);
});
