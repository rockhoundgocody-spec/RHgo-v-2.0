/**
 * Pure helpers for stripeWebhook — kept separate so they can be unit-tested
 * without Stripe or Base44.
 */
import { planForPrice, type EnvReader } from '../../shared/planCatalog.ts';

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
  items?: { data?: Array<{ current_period_end?: number | null; price?: { id?: string | null } | null }> } | null;
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
export function passEnd(days: unknown, nowMs: number): number | null {
  const d = Number(days);
  if (!Number.isFinite(d) || d <= 0 || d > 400) return null;
  return Math.floor(nowMs / 1000) + Math.round(d * 86400);
}

export function shouldIgnoreStripeEvent(
  event: { data?: { object?: StripeLike | null } | null } | null | undefined,
  appId: string | null | undefined,
): boolean {
  const metadata = event?.data?.object?.metadata;
  const tier = metadata?.tier;
  return !appId || metadata?.base44_test_checkout === 'true' ||
    metadata?.base44_app_id !== appId || !metadata?.owner_email ||
    typeof tier !== 'string' || !ENTITLEMENTS.has(tier);
}

/** The price the subscription is billed at now (its first item). */
export function subscriptionPriceId(sub: StripeLike | null | undefined): string | null {
  const id = sub?.items?.data?.[0]?.price?.id;
  return typeof id === 'string' && id ? id : null;
}

type KnownRow = { owner_email?: string | null; tier?: string | null; plan?: string | null } | null | undefined;

/**
 * Who a subscription event credits, and with which tier.
 *
 * - Tier follows the price the subscription is on, so renewals and plan
 *   changes made in the billing portal land on the right tier even when the
 *   metadata says otherwise.
 * - Subscriptions stamped by this app use metadata.owner_email.
 * - Older subscriptions with no app metadata are credited only when this app
 *   already holds a row for that exact Stripe subscription id — the row is
 *   proof of ownership, and keeps their renewals and cancellations syncing.
 * - Test checkouts and other apps' subscriptions are never credited.
 */
export function resolveSubscriptionCredit(
  sub: StripeLike | null | undefined,
  knownRow: KnownRow,
  appId: string | null | undefined,
  readEnv: EnvReader,
): { email: string; tier: string; plan: string | null } | null {
  if (!appId || !sub) return null;
  const metadata = sub.metadata || {};
  if (metadata.base44_test_checkout === 'true') return null;
  if (metadata.base44_app_id && metadata.base44_app_id !== appId) return null;

  const priced = planForPrice(subscriptionPriceId(sub), readEnv);

  if (!shouldIgnoreStripeEvent({ data: { object: sub } }, appId)) {
    return {
      email: String(metadata.owner_email).trim(),
      tier: priced?.entitlement ?? entitlementOf(metadata),
      plan: priced?.plan ?? (metadata.plan ? String(metadata.plan) : null),
    };
  }

  const email = knownRow?.owner_email ? String(knownRow.owner_email).trim() : '';
  if (!email) return null;
  const tier = priced?.entitlement ?? String(knownRow?.tier || '');
  if (!ENTITLEMENTS.has(tier)) return null;
  return { email, tier, plan: priced?.plan ?? (knownRow?.plan || null) };
}

export function checkoutPassEnd(
  session: (StripeLike & { created?: number | null }) | null | undefined,
): number | null {
  // Expiry is anchored to the original checkout, never webhook retry time.
  const created = session?.created;
  if (session?.metadata?.plan !== 'season' || typeof created !== 'number' || !Number.isFinite(created)) return null;
  return passEnd(30, created * 1000);
}