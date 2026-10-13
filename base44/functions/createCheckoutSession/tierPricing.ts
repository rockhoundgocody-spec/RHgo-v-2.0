/**
 * Checkout side of the plan catalog. The client names a plan (the ids on the
 * Pricing page); the server alone decides which Stripe price that plan
 * costs and which entitlement it grants. A client can never pick the
 * price or the entitlement. Plans whose price is unset report
 * `plan_unconfigured` instead of charging the wrong amount.
 */
import { PLAN_CONFIG, priceIdForPlan, type Entitlement, type EnvReader } from '../../shared/planCatalog.ts';

export { PLAN_CONFIG };
export type { Entitlement, PlanConfig } from '../../shared/planCatalog.ts';

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
  const priceId = priceIdForPlan(tier, readEnv);
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
