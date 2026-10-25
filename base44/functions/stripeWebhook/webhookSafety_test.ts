import { assertEquals } from 'jsr:@std/assert@1';
import { shouldIgnoreStripeEvent, checkoutPassEnd } from './subscriptionSync.ts';

Deno.test('self-tests, unrelated apps and unowned payments do not grant access', () => {
  const metadata = { base44_app_id: 'this-app', owner_email: 'fixture@example.invalid', tier: 'field_pro' };
  const event = (extra = {}) => ({ data: { object: { metadata: { ...metadata, ...extra } } } });
  assertEquals(shouldIgnoreStripeEvent(event(), 'this-app'), false);
  for (const extra of [{ base44_test_checkout: 'true' }, { base44_app_id: 'other-app' }, { owner_email: '' }, { tier: 'admin' }]) assertEquals(shouldIgnoreStripeEvent(event(extra), 'this-app'), true);
});
Deno.test('pass expiry is replay-stable and cannot use a caller-selected duration', () => {
  const session = { created: 1800000000, metadata: { plan: 'season', pass_days: '400' } };
  assertEquals(checkoutPassEnd(session), 1800000000 + 30 * 86400);
  assertEquals(checkoutPassEnd({ ...session, metadata: { plan: 'hound' } }), null);
});