import { assertEquals, assert } from 'jsr:@std/assert@1';
import { isValidRedirectTarget } from './redirectValidation.ts';

Deno.test('isValidRedirectTarget: allows valid local and production URLs', () => {
  assertEquals(isValidRedirectTarget('http://localhost:5173/pricing?success=true'), true);
  assertEquals(isValidRedirectTarget('http://127.0.0.1:3000/cancel'), true);
  assertEquals(isValidRedirectTarget('https://rockhoundgo.com/pricing'), true);
  assertEquals(isValidRedirectTarget('https://app.rockhoundgo.com/pricing'), true);
  assertEquals(isValidRedirectTarget('https://rhgo.base44.app/checkout/success'), true);
  assertEquals(isValidRedirectTarget('https://rhgo2.base44.app/checkout/cancel'), true);
  assertEquals(isValidRedirectTarget('https://sub.rhgo.base44.app/ok'), true);
});

Deno.test('isValidRedirectTarget: rejects untrusted third-party domains', () => {
  assertEquals(isValidRedirectTarget('https://evil.com'), false);
  assertEquals(isValidRedirectTarget('https://attacker.com/login'), false);
  assertEquals(isValidRedirectTarget('https://fake-base44.app.evil.com'), false);
  assertEquals(isValidRedirectTarget('https://rockhoundgo.com.evil.com'), false);
});

Deno.test('isValidRedirectTarget: rejects invalid or dangerous non-HTTP protocols and malformed inputs', () => {
  assertEquals(isValidRedirectTarget('javascript:alert(1)'), false);
  assertEquals(isValidRedirectTarget('data:text/html,<script>alert(1)</script>'), false);
  assertEquals(isValidRedirectTarget('not a url'), false);
  assertEquals(isValidRedirectTarget(''), false);
  assertEquals(isValidRedirectTarget(null as unknown as string), false);
  assertEquals(isValidRedirectTarget(undefined as unknown as string), false);
});
