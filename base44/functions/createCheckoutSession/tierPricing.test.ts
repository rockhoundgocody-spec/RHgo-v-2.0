import { describe, expect, it } from 'vitest';
import { resolveCheckoutPrice } from './tierPricing.ts';

const noEnv = () => undefined;

describe('resolveCheckoutPrice', () => {
  it('resolves only supported server-owned tiers', () => {
    expect(resolveCheckoutPrice('field_pro', undefined, noEnv)).toEqual({
      ok: true,
      priceId: 'price_1TpKQgIUhJzYk2OCgomTVSTb',
    });
    expect(resolveCheckoutPrice('family', undefined, noEnv)).toEqual({
      ok: true,
      priceId: 'price_1TpKQgIUhJzYk2OCw8PJzY0U',
    });
    expect(resolveCheckoutPrice('admin', undefined, noEnv)).toEqual({
      ok: false,
      error: 'Unsupported subscription tier',
    });
  });

  it('uses a valid server environment override', () => {
    const readEnv = (name: string) => name === 'STRIPE_FAMILY_MONTHLY_PRICE_ID'
      ? 'price_family_live'
      : undefined;

    expect(resolveCheckoutPrice('family', undefined, readEnv)).toEqual({
      ok: true,
      priceId: 'price_family_live',
    });
  });

  it('rejects arbitrary client prices and invalid server configuration', () => {
    expect(resolveCheckoutPrice('field_pro', 'price_attacker', noEnv)).toEqual({
      ok: false,
      error: 'Requested price does not match the configured tier',
    });
    expect(resolveCheckoutPrice('field_pro', undefined, () => 'not-a-price')).toEqual({
      ok: false,
      error: 'Invalid server price configuration for field_pro',
    });
  });
});
