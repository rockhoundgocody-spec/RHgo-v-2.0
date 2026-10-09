import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { deleteAccountBatch } from '../../shared/accountDeletion.ts';
export default async function(req) {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me().catch(() => null);
    if (!user?.id || !user?.email) return Response.json({ error: 'Sign in before deleting your account.' }, { status: 401 });
    const body = await req.json();
    const dryRun = body.dry_run === true;
    if (!dryRun && (body.confirmation !== 'DELETE' || body.acknowledge_retained_uploads !== true)) return Response.json({ error: 'Confirm deletion and acknowledge the uploaded-file retention notice.' }, { status: 400 });
    const cancelSubscription = async id => {
      if (typeof id !== 'string' || !/^sub_[A-Za-z0-9]+$/.test(id)) throw new Error('Subscription details need review before deleting this account.');
      const key = secrets.get('STRIPE_SECRET_KEY');
      if (!key) throw new Error('Billing cancellation is unavailable. Your account has not been removed.');
      const headers = { Authorization: `Bearer ${key}`, 'Stripe-Version': '2025-10-29.clover' };
      const url = `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      const subscription = await response.json();
      if (!response.ok) throw new Error('Could not verify the subscription. Retry deletion later.');
      const metadata = subscription.metadata || {};
      if ((metadata.owner_email && metadata.owner_email !== user.email) || (metadata.owner_id && metadata.owner_id !== user.id) || (metadata.base44_app_id && metadata.base44_app_id !== secrets.get('BASE44_APP_ID'))) throw new Error('Subscription ownership could not be verified. No cancellation was attempted.');
      if (subscription.status === 'canceled') return;
      const cancelled = await fetch(url, { method: 'DELETE', headers, signal: AbortSignal.timeout(15000) });
      if (!cancelled.ok) { console.error('Account deletion billing cancellation failed', cancelled.status); throw new Error('Billing cancellation failed. Retry deletion to finish.'); }
    };
    const result = await deleteAccountBatch(client, user, { dryRun, cancelSubscription });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Account deletion paused', error.message);
    return Response.json({ error: 'Deletion paused and may have partially completed. Your account remains available; retry to finish.', detail: error.message }, { status: 500 });
  }
}