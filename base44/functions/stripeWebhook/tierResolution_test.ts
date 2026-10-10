import { assertEquals } from 'jsr:@std/assert@1';
import { resolveSubscriptionCredit, subscriptionPriceId } from './subscriptionSync.ts';
import { planForPrice } from '../../shared/planCatalog.ts';

const env: Record<string, string> = {
  STRIPE_HOUND_PRICE_ID: 'price_hound',
  STRIPE_CLUB_PRICE_ID: 'price_club',
};
const readEnv = (name: string) => env[name];
const APP = 'this-app';

const sub = (priceId: string | null, metadata: Record<string, string> = {}) => ({
  id: 'sub_1',
  metadata,
  items: { data: priceId ? [{ price: { id: priceId } }] : [] },
});
const stamped = (tier: string, extra: Record<string, string> = {}) => ({
  base44_app_id: APP, owner_email: 'owner@example.invalid', tier, ...extra,
});

Deno.test('price maps back to its plan, including legacy fallback prices', () => {
  assertEquals(planForPrice('price_club', readEnv), { plan: 'club', entitlement: 'family' });
  assertEquals(planForPrice('price_1TpKQgIUhJzYk2OCw8PJzY0U', readEnv), { plan: 'family', entitlement: 'family' });
  assertEquals(planForPrice('price_unknown', readEnv), null);
  assertEquals(planForPrice(undefined, readEnv), null);
  assertEquals(subscriptionPriceId(sub('price_club')), 'price_club');
  assertEquals(subscriptionPriceId(sub(null)), null);
});

Deno.test('renewal of a family plan stays family', () => {
  const credit = resolveSubscriptionCredit(sub('price_club', stamped('family')), null, APP, readEnv);
  assertEquals(credit, { email: 'owner@example.invalid', tier: 'family', plan: 'club' });
});

Deno.test('plan changed in the billing portal follows the new price, not stale metadata', () => {
  const upgraded = resolveSubscriptionCredit(sub('price_club', stamped('field_pro', { plan: 'hound' })), null, APP, readEnv);
  assertEquals(upgraded?.tier, 'family');
  assertEquals(upgraded?.plan, 'club');
  const downgraded = resolveSubscriptionCredit(sub('price_hound', stamped('family', { plan: 'club' })), null, APP, readEnv);
  assertEquals(downgraded?.tier, 'field_pro');
});

Deno.test('unknown price falls back to stamped metadata tier', () => {
  const credit = resolveSubscriptionCredit(sub('price_unknown', stamped('family', { plan: 'club' })), null, APP, readEnv);
  assertEquals(credit, { email: 'owner@example.invalid', tier: 'family', plan: 'club' });
});

Deno.test('subscription without app metadata syncs only through its stored row', () => {
  const row = { owner_email: 'legacy@example.invalid', tier: 'family', plan: 'family' };
  assertEquals(
    resolveSubscriptionCredit(sub('price_1TpKQgIUhJzYk2OCw8PJzY0U'), row, APP, readEnv),
    { email: 'legacy@example.invalid', tier: 'family', plan: 'family' },
  );
  // Unknown price: keep the tier the row already has.
  assertEquals(resolveSubscriptionCredit(sub('price_unknown'), row, APP, readEnv)?.tier, 'family');
  // No row for this subscription id: not ours to credit.
  assertEquals(resolveSubscriptionCredit(sub('price_club'), null, APP, readEnv), null);
});

Deno.test('test checkouts and other apps are never credited, even with a matching row', () => {
  const row = { owner_email: 'x@example.invalid', tier: 'family' };
  assertEquals(resolveSubscriptionCredit(sub('price_club', { base44_test_checkout: 'true' }), row, APP, readEnv), null);
  assertEquals(resolveSubscriptionCredit(sub('price_club', { base44_app_id: 'other-app' }), row, APP, readEnv), null);
  assertEquals(resolveSubscriptionCredit(sub('price_club', stamped('family')), row, null, readEnv), null);
});

Deno.test('a row with no usable tier and an unknown price grants nothing', () => {
  assertEquals(resolveSubscriptionCredit(sub('price_unknown'), { owner_email: 'x@example.invalid', tier: 'free' }, APP, readEnv), null);
  assertEquals(resolveSubscriptionCredit(sub('price_club'), { owner_email: '', tier: 'family' }, APP, readEnv), null);
});
