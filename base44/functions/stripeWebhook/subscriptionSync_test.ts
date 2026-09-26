import { assertEquals } from 'jsr:@std/assert@1';
import { entitlementOf, mapStatus, ownerEmailOf, passEnd, periodEndOf } from './subscriptionSync.ts';

Deno.test('every Stripe status maps into the entity enum without granting access by accident', () => {
  assertEquals(mapStatus('active'), 'active');
  assertEquals(mapStatus('trialing'), 'trialing');
  assertEquals(mapStatus('past_due'), 'past_due');
  assertEquals(mapStatus('paused'), 'paused');
  assertEquals(mapStatus('incomplete'), 'incomplete');
  assertEquals(mapStatus('incomplete_expired'), 'cancelled');
  assertEquals(mapStatus('unpaid'), 'cancelled');
  assertEquals(mapStatus('canceled'), 'cancelled');
  assertEquals(mapStatus('some_future_status'), 'incomplete');
  assertEquals(mapStatus(undefined), 'incomplete');
});

Deno.test('owner comes from app metadata before any Stripe-side email', () => {
  assertEquals(ownerEmailOf({
    metadata: { owner_email: 'Cody@Example.com' },
    customer_email: 'other@example.com',
    customer_details: { email: 'typed@example.com' },
  }), 'cody@example.com');
  assertEquals(ownerEmailOf({ customer_details: { email: 'typed@example.com' } }), 'typed@example.com');
  assertEquals(ownerEmailOf({}), null);
});

Deno.test('entitlement defaults safely', () => {
  assertEquals(entitlementOf({ tier: 'family' }), 'family');
  assertEquals(entitlementOf({ tier: 'admin' }), 'field_pro');
  assertEquals(entitlementOf(null), 'field_pro');
});

Deno.test('period end is read from the subscription or its first item', () => {
  assertEquals(periodEndOf({ current_period_end: 1800000000 }), 1800000000);
  assertEquals(periodEndOf({ items: { data: [{ current_period_end: 1800000500 }] } }), 1800000500);
  assertEquals(periodEndOf({}), null);
});

Deno.test('passes run for their configured days', () => {
  const now = Date.parse('2026-09-26T00:00:00Z');
  assertEquals(passEnd('30', now), Math.floor(now / 1000) + 30 * 86400);
  assertEquals(passEnd(undefined, now), null);
  assertEquals(passEnd('-4', now), null);
});
