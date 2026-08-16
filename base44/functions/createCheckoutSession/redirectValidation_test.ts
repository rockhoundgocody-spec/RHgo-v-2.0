import { assertEquals } from 'jsr:@std/assert@1';
import { isValidRedirectTarget } from './redirectValidation.ts';

Deno.test('isValidRedirectTarget: allows valid local and application URLs', () => {
  assertEquals(isValidRedirectTarget('http://localhost:3000/success'), true);
  assertEquals(isValidRedirectTarget('http://127.0.0.1:5173/cancel'), true);
  assertEquals(isValidRedirectTarget('https://rhgo.base44.app/pricing'), true);
  assertEquals(isValidRedirectTarget('https://rhgo2.base44.app/checkout/success'), true);
  assertEquals(isValidRedirectTarget('https://my-subdomain.base44.app/callback'), true);
});

Deno.test('isValidRedirectTarget: rejects external or unapproved domains', () => {
  assertEquals(isValidRedirectTarget('https://evil.com'), false);
  assertEquals(isValidRedirectTarget('https://phishing.org/login'), false);
  assertEquals(isValidRedirectTarget('https://base44.app.evil.com/fake'), false);
  assertEquals(isValidRedirectTarget('https://notbase44.app/'), false);
});

Deno.test('isValidRedirectTarget: rejects non-http/https protocols', () => {
  assertEquals(isValidRedirectTarget('javascript:alert(1)'), false);
  assertEquals(isValidRedirectTarget('data:text/html,<script>alert(1)</script>'), false);
  assertEquals(isValidRedirectTarget('file:///etc/passwd'), false);
});

Deno.test('isValidRedirectTarget: handles invalid or empty inputs safely', () => {
  assertEquals(isValidRedirectTarget(''), false);
  assertEquals(isValidRedirectTarget(null as unknown as string), false);
  assertEquals(isValidRedirectTarget(undefined as unknown as string), false);
  assertEquals(isValidRedirectTarget('invalid-url-string'), false);
});
