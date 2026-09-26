/**
 * subscriptionAccess — client mirror of base44/shared/subscriptionAccess.ts.
 * Keep the two in step: the server decides access, this only drives UI.
 */

export const PAID_TIERS = new Set(['field_pro', 'family']);
export const PAID_STATUSES = new Set(['active', 'trialing', 'past_due']);
export const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000;
export const FREE_MONTHLY_SCANS = 5;

export function isPaidSubscription(sub, now = Date.now()) {
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
