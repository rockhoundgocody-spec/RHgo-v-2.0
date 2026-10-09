import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import Stripe from 'npm:stripe@14.25.0';
import { secrets } from 'base44:runtime';
import { entitlementOf, mapStatus, ownerEmailOf, checkoutPassEnd, periodEndOf, shouldIgnoreStripeEvent } from './subscriptionSync.ts';

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
 * is only a fallback for older sessions. Entitlement comes from
 * metadata.tier, never from the client.
 *
 * Uses the service role to write Subscription records (the webhook has no user auth).
 */

async function getCustomerEmail(stripe, customerId) {
  if (!customerId || typeof customerId !== 'string') return null;
  try {
    const c = await stripe.customers.retrieve(customerId);
    return c && !c.deleted && c.email ? String(c.email) : null;
  } catch { return null; }
}

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
    } catch (error) {
      console.warn('stripeWebhook: rejected invalid signature');
      return Response.json({ error: 'invalid signature' }, { status: 400 });
    }
    if (shouldIgnoreStripeEvent(event, secrets.get('BASE44_APP_ID'))) return Response.json({ received: true, ignored: true });
    const data = event.data.object;
    const email = String(data.metadata.owner_email).trim();
    const tier = entitlementOf(data.metadata);
    const plan = data.metadata.plan || null;
    const customerId = typeof data.customer === 'string' ? data.customer : data.customer?.id;
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      if (data.mode === 'payment') {
        if (data.payment_status !== 'paid') return Response.json({ received: true, pending: true });
        const end = checkoutPassEnd(data);
        if (!end) return Response.json({ received: true, ignored: true });
        await upsertSubscription(base44, { email, tier, plan, customerId, subscriptionId: null, status: 'active', periodEnd: end, event });
      } else if (data.mode === 'subscription') {
        const subscriptionId = typeof data.subscription === 'string' ? data.subscription : data.subscription?.id;
        if (!subscriptionId) return Response.json({ received: true, ignored: true });
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (shouldIgnoreStripeEvent({ data: { object: sub } }, secrets.get('BASE44_APP_ID'))) return Response.json({ received: true, ignored: true });
        await upsertSubscription(base44, { email: String(sub.metadata.owner_email).trim(), tier: entitlementOf(sub.metadata), plan: sub.metadata.plan, customerId, subscriptionId, status: mapStatus(sub.status), periodEnd: periodEndOf(sub), event });
      }
    } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      // Fetch Stripe's current state so delayed events cannot restore an old status.
      const sub = await stripe.subscriptions.retrieve(data.id);
      if (shouldIgnoreStripeEvent({ data: { object: sub } }, secrets.get('BASE44_APP_ID'))) return Response.json({ received: true, ignored: true });
      await upsertSubscription(base44, { email, tier: entitlementOf(sub.metadata), plan: sub.metadata.plan, customerId, subscriptionId: sub.id, status: mapStatus(sub.status), periodEnd: periodEndOf(sub), event });
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}