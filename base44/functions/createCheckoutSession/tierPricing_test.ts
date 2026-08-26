import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { resolveCheckoutPrice } from './tierPricing.ts';

const noEnv = () => undefined;

Deno.test('resolveCheckoutPrice resolves only supported server-owned tiers', () => {
  assertEquals(resolveCheckoutPrice('field_pro', undefined, noEnv), {
    ok: true,
    priceId: 'price_1TpKQgIUhJzYk2OCgomTVSTb',
  });
  assertEquals(resolveCheckoutPrice('family', undefined, noEnv), {
    ok: true,
    priceId: 'price_1TpKQgIUhJzYk2OCw8PJzY0U',
  });
  assertEquals(resolveCheckoutPrice('admin', undefined, noEnv), {
    ok: false,
    error: 'Unsupported subscription tier',
  });
});

Deno.test('resolveCheckoutPrice uses a valid server environment override', () => {
  const readEnv = (name: string) =>
    name === 'STRIPE_FAMILY_MONTHLY_PRICE_ID' ? 'price_family_live' : undefined;

  assertEquals(resolveCheckoutPrice('family', undefined, readEnv), {
    ok: true,
    priceId: 'price_family_live',
  });
});

Deno.test('resolveCheckoutPrice rejects client prices and invalid server configuration', () => {
  assertEquals(resolveCheckoutPrice('field_pro', 'price_attacker', noEnv), {
    ok: false,
    error: 'Requested price does not match the configured tier',
  });
  assertEquals(resolveCheckoutPrice('field_pro', undefined, () => 'not-a-price'), {
    ok: false,
    error: 'Invalid server price configuration for field_pro',
  });
});
