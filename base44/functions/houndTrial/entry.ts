import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { houndTrialStatus } from '../../shared/houndTrial.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Sign in to check your trial.' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';
    if (!['status', 'start'].includes(action)) return Response.json({ error: 'Unsupported trial action.' }, { status: 400 });
    const [subscriptions, scans] = await Promise.all([
      base44.asServiceRole.entities.Subscription.filter({ owner_email: user.email }, '-created_date', 100),
      base44.asServiceRole.entities.ScanReceipt.filter({ owner_email: user.email, kind: 'member_identify' }, 'created_date', 1),
    ]);
    const status = houndTrialStatus(subscriptions || [], scans?.[0]);
    if (action === 'status') return Response.json(status);
    const currentTrial = subscriptions.find((s) => s.plan === 'hound_trial');
    if (status.state === 'active') return Response.json({ ...status, subscription_id: currentTrial.id });
    if (!status.eligible) {
      const error = status.state === 'needs_scan' ? 'Complete your first signed-in scan before activating the trial.'
        : status.state === 'expired' ? 'Your 14-day trial window has ended.'
          : 'This account is not eligible for a new Hound trial.';
      return Response.json({ ...status, error }, { status: 409 });
    }
    // Expiry is anchored to the first immutable server receipt, not this request.
    // Retries and simultaneous starts therefore cannot extend the trial window.
    const patch = { tier: 'field_pro', plan: 'hound_trial', status: 'trialing', trial_end: status.ends_at, current_period_end: status.ends_at };
    const free = subscriptions.find((s) => s.tier === 'free' && !s.stripe_subscription_id && !s.stripe_customer_id);
    const row = free
      ? await base44.asServiceRole.entities.Subscription.update(free.id, patch)
      : await base44.asServiceRole.entities.Subscription.create({ owner_email: user.email, ...patch });
    return Response.json({ state: 'active', eligible: false, ends_at: status.ends_at, subscription_id: row.id });
  } catch (error) {
    console.error('houndTrial failed:', error);
    return Response.json({ error: 'Unable to check or activate your trial. Please try again.' }, { status: 500 });
  }
}