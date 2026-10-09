import { isPaidSubscription } from './subscriptionAccess.ts';

const DAY_MS = 86400000;
export function houndTrialStatus(subscriptions, firstScan, now = Date.now()) {
  const trial = subscriptions.find((s) => s.plan === 'hound_trial');
  const paid = subscriptions.find((s) => s.plan !== 'hound_trial' && isPaidSubscription(s, now));
  if (paid) return { state: 'member', eligible: false, ends_at: null };
  if (trial) {
    const end = Date.parse(trial.trial_end || trial.current_period_end || '');
    return { state: Number.isFinite(end) && end > now && isPaidSubscription(trial, now) ? 'active' : 'expired', eligible: false, ends_at: Number.isFinite(end) ? new Date(end).toISOString() : null };
  }
  if (subscriptions.some((s) => s.stripe_subscription_id || s.stripe_customer_id || ['field_pro', 'family'].includes(s.tier))) {
    return { state: 'unavailable', eligible: false, ends_at: null };
  }
  if (!firstScan) return { state: 'needs_scan', eligible: false, ends_at: null };
  const raw = String(firstScan.created_date || '');
  const start = Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(raw) ? raw : `${raw}Z`);
  if (!Number.isFinite(start) || start > now) return { state: 'needs_scan', eligible: false, ends_at: null };
  const end = start + 14 * DAY_MS;
  return { state: end > now ? 'eligible' : 'expired', eligible: end > now, ends_at: new Date(end).toISOString() };
}