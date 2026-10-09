/**
 * subscriptionAccess — one definition of "this subscription grants paid
 * features", shared by every backend function (and mirrored in
 * src/lib/subscriptionAccess.js for the client).
 *
 * Rules:
 *  - tier must be a paid tier (field_pro | family)
 *  - status must be one Stripe still bills or grants access for:
 *    active, trialing, past_due (Stripe is retrying — keep the field kit
 *    working during the dunning window)
 *  - a recorded period end that is well in the past means the access
 *    lapsed even if a webhook was missed. Recurring subscriptions get a
 *    3-day grace (renewal webhooks can lag); one-time passes (no Stripe
 *    subscription id) expire exactly at their end.
 */

export const PAID_TIERS: ReadonlySet<string> = new Set(['field_pro', 'family']);
export const PAID_STATUSES: ReadonlySet<string> = new Set(['active', 'trialing', 'past_due']);
export const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000;
export const FREE_DAILY_SCANS = 7;

export function dayStartIso(date: Date = new Date()): string {
  return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

export function nextDayStartIso(date: Date = new Date()): string {
  return new Date(Date.parse(dayStartIso(date)) + 86400000).toISOString();
}

export type SubscriptionLike = {
  tier?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  stripe_subscription_id?: string | null;
} | null | undefined;

export function isPaidSubscription(sub: SubscriptionLike, now: number = Date.now()): boolean {
  if (!sub) return false;
  if (!PAID_TIERS.has(String(sub.tier))) return false;
  if (!PAID_STATUSES.has(String(sub.status))) return false;
  if (sub.current_period_end) {
    const end = Date.parse(sub.current_period_end);
    if (Number.isFinite(end)) {
      const grace = sub.stripe_subscription_id ? RENEWAL_GRACE_MS : 0;
      if (end + grace < now) return false;
    }
  }
  return true;
}

/** UTC calendar month a scan counts against, e.g. "2026-09". */
export function monthKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

/** Start of the next UTC month — when the free allowance resets. */
export function nextMonthStartIso(date: Date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString();
}