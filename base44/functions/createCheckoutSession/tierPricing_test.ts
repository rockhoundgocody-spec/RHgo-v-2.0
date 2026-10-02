import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { resolveCheckoutPrice } from './tierPricing.ts';

const noEnv = () => undefined;

Deno.test('legacy plan ids resolve to their server-owned prices and entitlements', () => {
  assertEquals(resolveCheckoutPrice('field_pro', undefined, noEnv), {
    ok: true,
    priceId: 'price_1TpKQgIUhJzYk2OCgomTVSTb',
    plan: 'field_pro',
    entitlement: 'field_pro',
    passDays: null,
  });
  assertEquals(resolveCheckoutPrice('family', undefined, noEnv), {
    ok: true,
    priceId: 'price_1TpKQgIUhJzYk2OCw8PJzY0U',
    plan: 'family',
    entitlement: 'family',
    passDays: null,
  });
});

Deno.test('unknown plans are rejected', () => {
  assertEquals(resolveCheckoutPrice('admin', undefined, noEnv), {
    ok: false,
    error: 'Unsupported subscription tier',
    code: 'unsupported_plan',
  });
  // Inherited object keys are not plans.
  assertEquals(resolveCheckoutPrice('toString', undefined, noEnv).ok, false);
});

Deno.test('pricing-page plans map to entitlements and need a configured price', () => {
  assertEquals(resolveCheckoutPrice('hound', undefined, noEnv), {
    ok: false,
    error: 'The hound plan is not available yet',
    code: 'plan_unconfigured',
  });
  const env = (name: string) => ({
    STRIPE_HOUND_PRICE_ID: 'price_hound_annual',
    STRIPE_CLUB_PRICE_ID: 'price_club_annual',
    STRIPE_SEASON_PRICE_ID: 'price_season_pass',
  } as Record<string, string>)[name];
  assertEquals(resolveCheckoutPrice('hound', undefined, env), {
    ok: true, priceId: 'price_hound_annual', plan: 'hound', entitlement: 'field_pro', passDays: null,
  });
  assertEquals(resolveCheckoutPrice('club', undefined, env), {
    ok: true, priceId: 'price_club_annual', plan: 'club', entitlement: 'family', passDays: null,
  });
  assertEquals(resolveCheckoutPrice('season', undefined, env), {
    ok: true, priceId: 'price_season_pass', plan: 'season', entitlement: 'field_pro', passDays: 30,
  });
});

Deno.test('resolveCheckoutPrice uses a valid server environment override', () => {
  const readEnv = (name: string) =>
    name === 'STRIPE_FAMILY_MONTHLY_PRICE_ID' ? 'price_family_live' : undefined;

  assertEquals(resolveCheckoutPrice('family', undefined, readEnv), {
    ok: true,
    priceId: 'price_family_live',
    plan: 'family',
    entitlement: 'family',
    passDays: null,
  });
});

Deno.test('resolveCheckoutPrice rejects client prices and invalid server configuration', () => {
  assertEquals(resolveCheckoutPrice('field_pro', 'price_attacker', noEnv), {
    ok: false,
    error: 'Requested price does not match the configured tier',
    code: 'price_mismatch',
  });
  assertEquals(resolveCheckoutPrice('field_pro', undefined, () => 'not-a-price'), {
    ok: false,
    error: 'Invalid server price configuration for field_pro',
    code: 'bad_config',
  });
});
