import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import Stripe from 'npm:stripe@14.25.0';
import { secrets } from 'base44:runtime';
import { entitlementOf, mapStatus, checkoutPassEnd, periodEndOf, shouldIgnoreStripeEvent, resolveSubscriptionCredit } from './subscriptionSync.ts';
import { safeError } from '../../shared/httpErrors.ts';

/**
 * stripeWebhook — keeps the Subscription entity in sync with Stripe.
 *
 * Events handled:
 *   checkout.session.completed                 → activate (subscription) or grant a pass (one-time)
 *   customer.subscription.created / updated    → refresh status + current_period_end
 *   customer.subscription.deleted              → mark cancelled
 *
 * Ownership comes from metadata.owner_email stamped by createCheckoutSession
 * (the signed-in account that started checkout); the email typed into Stripe
 * is only a fallback for older sessions. For subscriptions, entitlement comes
 * from the price the subscription is billed at (metadata.tier only when the
 * price is unknown), never from the client. Subscriptions created before the
 * app stamped metadata are synced through the row already stored for their
 * Stripe subscription id (resolveSubscriptionCredit).
 *
 * Uses the service role to write Subscription records (the webhook has no user auth).
 */

async function findSubscriptionRow(base44, email, stripeSubscriptionId) {
  if (stripeSubscriptionId) {
    const bySub = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: stripeSubscriptionId });
    if (bySub?.[0]) return bySub[0];
  }
  if (!email) return null;
  const byEmail = await base44.asServiceRole.entities.Subscription.filter({ owner_email: email });
  return byEmail?.[0] || null;
}

async function upsertSubscription(base44, { email, tier, plan, status, customerId, subscriptionId, periodEnd, event }) {
  if (!email) {
    console.error('stripeWebhook: no owner email — cannot credit subscription', subscriptionId || '');
    return;
  }
  const existing = await findSubscriptionRow(base44, email, subscriptionId);
  if (existing?.last_stripe_event_id === event.id || existing?.last_stripe_event_created > event.created) return;
  const patch = {
    last_stripe_event_id: event.id,
    last_stripe_event_created: event.created,
    tier,
    status,
    ...(plan ? { plan } : {}),
    ...(customerId ? { stripe_customer_id: customerId } : {}),
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
  };
  if (existing) {
    await base44.asServiceRole.entities.Subscription.update(existing.id, patch);
  } else {
    await base44.asServiceRole.entities.Subscription.create({ owner_email: email, ...patch });
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      base44.auth.setToken(authHeader.replace(/^Bearer\s+/i, ''));
      await base44.auth.me();
    }
    const sig = req.headers.get('stripe-signature');
    if (!sig) return Response.json({ error: 'invalid signature' }, { status: 400 });
    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(await req.text(), sig, secrets.get('STRIPE_WEBHOOK_SECRET'));
    } catch {
      console.warn('stripeWebhook: rejected invalid signature');
      return Response.json({ error: 'invalid signature' }, { status: 400 });
    }
    const appId = secrets.get('BASE44_APP_ID');
    const readEnv = (name: string) => secrets.get(name);
    const data = event.data.object;
    const customerId = typeof data.customer === 'string' ? data.customer : data.customer?.id;

    // Credit a subscription from Stripe's current state of it.
    const syncSubscription = async (sub) => {
      const known = await findSubscriptionRow(base44, null, sub.id);
      const credit = resolveSubscriptionCredit(sub, known, appId, readEnv);
      if (!credit) return false;
      await upsertSubscription(base44, { ...credit, customerId, subscriptionId: sub.id, status: mapStatus(sub.status), periodEnd: periodEndOf(sub), event });
      return true;
    };

    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      // A checkout is only ever credited when this app stamped it.
      if (shouldIgnoreStripeEvent(event, appId)) return Response.json({ received: true, ignored: true });
      const email = String(data.metadata.owner_email).trim();
      const tier = entitlementOf(data.metadata);
      const plan = data.metadata.plan || null;
      if (data.mode === 'payment') {
        if (data.payment_status !== 'paid') return Response.json({ received: true, pending: true });
        const end = checkoutPassEnd(data);
        if (!end) return Response.json({ received: true, ignored: true });
        await upsertSubscription(base44, { email, tier, plan, customerId, subscriptionId: null, status: 'active', periodEnd: end, event });
      } else if (data.mode === 'subscription') {
        const subscriptionId = typeof data.subscription === 'string' ? data.subscription : data.subscription?.id;
        if (!subscriptionId) return Response.json({ received: true, ignored: true });
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (!(await syncSubscription(sub))) return Response.json({ received: true, ignored: true });
      }
    } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      // Fetch Stripe's current state so delayed events cannot restore an old status.
      const sub = await stripe.subscriptions.retrieve(data.id);
      if (!(await syncSubscription(sub))) return Response.json({ received: true, ignored: true });
    } else {
      return Response.json({ received: true, ignored: true });
    }
    return Response.json({ received: true });
  } catch (error) {
    return safeError('stripeWebhook', error);
  }
}