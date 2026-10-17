/**
 * Server-owned plan catalog, shared by checkout (plan → price) and the
 * Stripe webhook (price → plan). The price a subscription is actually on is
 * the source of truth for its entitlement: metadata can be missing (older
 * subscriptions) or stale (a plan changed in the billing portal keeps the
 * metadata it was created with).
 *
 * Each plan's Stripe price id lives in a server env var. Plans whose var is
 * unset have no price and cannot be bought or recognised.
 */
export type Entitlement = 'field_pro' | 'family';
export type EnvReader = (name: string) => string | undefined;
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

/** The price id a plan is sold at right now, or '' when unconfigured. */
export function priceIdForPlan(plan: string, readEnv: EnvReader): string {
  const config = PLAN_CONFIG[plan];
  if (!config) return '';
  return readEnv(config.env)?.trim() || config.fallback || '';
}

/**
 * Which plan a Stripe price belongs to. Matches both the configured env price
 * and the legacy fallback, so subscribers on a retired price keep their tier.
 */
export function planForPrice(
  priceId: unknown,
  readEnv: EnvReader,
): { plan: string; entitlement: Entitlement } | null {
  if (typeof priceId !== 'string' || !priceId.startsWith('price_')) return null;
  for (const [plan, config] of Object.entries(PLAN_CONFIG)) {
    const configured = readEnv(config.env)?.trim();
    if (priceId === configured || priceId === config.fallback) {
      return { plan, entitlement: config.entitlement };
    }
  }
  return null;
}
