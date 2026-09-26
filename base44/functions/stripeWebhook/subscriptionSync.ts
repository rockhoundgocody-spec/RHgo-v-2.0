/**
 * Pure helpers for stripeWebhook — kept separate so they can be unit-tested
 * without Stripe or Base44.
 */

export const TIER_DEFAULT = 'field_pro';
const ENTITLEMENTS = new Set(['field_pro', 'family']);

/**
 * Map a Stripe subscription status onto the Subscription entity's enum.
 * Anything unknown maps to a state that grants no access, so a new Stripe
 * status can never fail entity validation or silently unlock the app.
 */
export function mapStatus(stripeStatus: unknown): string {
  switch (stripeStatus) {
    case 'active': return 'active';
    case 'trialing': return 'trialing';
    case 'past_due': return 'past_due';
    case 'paused': return 'paused';
    case 'incomplete': return 'incomplete';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'cancelled';
    default:
      return 'incomplete';
  }
}

export function entitlementOf(metadata: Record<string, unknown> | null | undefined): string {
  const t = String(metadata?.tier || '');
  return ENTITLEMENTS.has(t) ? t : TIER_DEFAULT;
}

/**
 * The account a Stripe object belongs to. The app stamps
 * metadata.owner_email at checkout; the Stripe-side email is only a fallback
 * for sessions created before that existed.
 */
type StripeLike = {
  metadata?: Record<string, unknown> | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> } | null;
};

export function ownerEmailOf(obj: StripeLike | null | undefined): string | null {
  const email = obj?.metadata?.owner_email || obj?.customer_email || obj?.customer_details?.email || null;
  // Kept exactly as the app stored it: Subscription rows are looked up by
  // the signed-in user's email as-is.
  return email ? String(email).trim() || null : null;
}

/** current_period_end moved onto subscription items in newer Stripe API versions. */
export function periodEndOf(sub: StripeLike | null | undefined): number | null {
  const v = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end ?? null;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Unix seconds when a one-time pass bought now runs out. */
export function passEnd(days: unknown, nowMs: number = Date.now()): number | null {
  const d = Number(days);
  if (!Number.isFinite(d) || d <= 0 || d > 400) return null;
  return Math.floor(nowMs / 1000) + Math.round(d * 86400);
}
