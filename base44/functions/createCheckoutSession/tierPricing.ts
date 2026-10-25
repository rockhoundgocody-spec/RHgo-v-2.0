type EnvReader = (name: string) => string | undefined;

/**
 * Server-owned plan catalog. The client names a plan (the ids on the
 * Pricing page); the server alone decides which Stripe price that plan
 * costs and which entitlement it grants. A client can never pick the
 * price or the entitlement.
 *
 * Each plan's Stripe price id lives in a server env var. Plans whose var is
 * unset report `plan_unconfigured` instead of charging the wrong amount.
 */
export type Entitlement = 'field_pro' | 'family';
export type PlanConfig = {
  entitlement: Entitlement;
  env: string;
  /** Legacy default used only when the env var is unset. */
  fallback?: string;
  /** Length of a one-time pass, when the configured price is not recurring. */
  passDays?: number;
};

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  season: { entitlement: 'field_pro', env: 'STRIPE_SEASON_PRICE_ID', passDays: 30 },
  hound: { entitlement: 'field_pro', env: 'STRIPE_HOUND_PRICE_ID' },
  steward: { entitlement: 'field_pro', env: 'STRIPE_STEWARD_PRICE_ID' },
  club: { entitlement: 'family', env: 'STRIPE_CLUB_PRICE_ID' },
  // Legacy plan ids still sent by older clients.
  field_pro: {
    entitlement: 'field_pro',
    env: 'STRIPE_FIELD_PRO_MONTHLY_PRICE_ID',
    fallback: 'price_1TpKQgIUhJzYk2OCgomTVSTb',
  },
  family: {
    entitlement: 'family',
    env: 'STRIPE_FAMILY_MONTHLY_PRICE_ID',
    fallback: 'price_1TpKQgIUhJzYk2OCw8PJzY0U',
  },
};

export type ResolvedPrice =
  | { ok: true; priceId: string; plan: string; entitlement: Entitlement; passDays: number | null }
  | { ok: false; error: string; code: 'unsupported_plan' | 'plan_unconfigured' | 'bad_config' | 'price_mismatch' };

export function resolveCheckoutPrice(
  tier: unknown,
  requestedPriceId: unknown,
  readEnv: EnvReader,
): ResolvedPrice {
  if (typeof tier !== 'string' || !Object.prototype.hasOwnProperty.call(PLAN_CONFIG, tier)) {
    return { ok: false, error: 'Unsupported subscription tier', code: 'unsupported_plan' };
  }

  const config = PLAN_CONFIG[tier];
  const priceId = readEnv(config.env)?.trim() || config.fallback || '';
  if (!priceId) {
    return { ok: false, error: `The ${tier} plan is not available yet`, code: 'plan_unconfigured' };
  }
  if (!priceId.startsWith('price_')) {
    return { ok: false, error: `Invalid server price configuration for ${tier}`, code: 'bad_config' };
  }

  // Legacy clients may still send a price ID, but it must exactly match the
  // server-owned configuration. New clients send only the plan.
  if (requestedPriceId != null && requestedPriceId !== priceId) {
    return { ok: false, error: 'Requested price does not match the configured tier', code: 'price_mismatch' };
  }

  return { ok: true, priceId, plan: tier, entitlement: config.entitlement, passDays: config.passDays ?? null };
}
