import { assertEquals } from 'jsr:@std/assert@1';
import { isValidRedirectTarget } from './redirectValidation.ts';

Deno.test('isValidRedirectTarget: allows valid base44 app origins', () => {
  assertEquals(isValidRedirectTarget('https://rhgo.base44.app/settings?upgrade=success'), true);
  assertEquals(isValidRedirectTarget('https://rhgo2.base44.app/pricing'), true);
  assertEquals(isValidRedirectTarget('https://sub.rhgo.base44.app/page'), true);
});

Deno.test('isValidRedirectTarget: allows localhost and local IP origins for local testing', () => {
  assertEquals(isValidRedirectTarget('http://localhost:3000/pricing'), true);
  assertEquals(isValidRedirectTarget('http://127.0.0.1:5173/settings'), true);
});

Deno.test('isValidRedirectTarget: rejects unapproved external domains', () => {
  assertEquals(isValidRedirectTarget('https://attacker.com/malicious'), false);
  assertEquals(isValidRedirectTarget('https://evil-base44.app.com/phish'), false);
  assertEquals(isValidRedirectTarget('https://fakebase44.app/login'), false);
});

Deno.test('isValidRedirectTarget: rejects non-http/https protocols', () => {
  assertEquals(isValidRedirectTarget('javascript:alert(1)'), false);
  assertEquals(isValidRedirectTarget('data:text/html,<script>alert(1)</script>'), false);
});

Deno.test('isValidRedirectTarget: handles empty or non-string inputs safely', () => {
  assertEquals(isValidRedirectTarget(''), false);
  assertEquals(isValidRedirectTarget(null as unknown as string), false);
  assertEquals(isValidRedirectTarget(undefined as unknown as string), false);
  assertEquals(isValidRedirectTarget(12345 as unknown as string), false);
});
