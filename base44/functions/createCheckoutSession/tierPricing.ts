type EnvReader = (name: string) => string | undefined;

const TIER_CONFIG = {
  field_pro: {
    env: 'STRIPE_FIELD_PRO_MONTHLY_PRICE_ID',
    fallback: 'price_1TpKQgIUhJzYk2OCgomTVSTb',
  },
  family: {
    env: 'STRIPE_FAMILY_MONTHLY_PRICE_ID',
    fallback: 'price_1TpKQgIUhJzYk2OCw8PJzY0U',
  },
} as const;

export function resolveCheckoutPrice(
  tier: unknown,
  requestedPriceId: unknown,
  readEnv: EnvReader,
): { ok: true; priceId: string } | { ok: false; error: string } {
  if (typeof tier !== 'string' || !(tier in TIER_CONFIG)) {
    return { ok: false, error: 'Unsupported subscription tier' };
  }

  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
  const priceId = readEnv(config.env)?.trim() || config.fallback;
  if (!priceId.startsWith('price_')) {
    return { ok: false, error: `Invalid server price configuration for ${tier}` };
  }

  // Legacy clients may still send a price ID, but it must exactly match the
  // server-owned configuration. New clients send only the tier.
  if (requestedPriceId != null && requestedPriceId !== priceId) {
    return { ok: false, error: 'Requested price does not match the configured tier' };
  }

  return { ok: true, priceId };
}
