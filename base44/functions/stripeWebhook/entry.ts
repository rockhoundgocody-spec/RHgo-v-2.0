import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';
import { entitlementOf, mapStatus, ownerEmailOf, passEnd, periodEndOf } from './subscriptionSync.ts';

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

async function upsertSubscription(base44, { email, tier, plan, status, customerId, subscriptionId, periodEnd }) {
  if (!email) {
    console.error('stripeWebhook: no owner email — cannot credit subscription', subscriptionId || '');
    return;
  }
  const existing = await findSubscriptionRow(base44, email, subscriptionId);
  const patch = {
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

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const sig = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    const rawBody = await req.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret);
  } catch (err) {
    console.error('stripe webhook signature failed:', err.message);
    return Response.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const data = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const email = ownerEmailOf(data) || await getCustomerEmail(stripe, data.customer);
      const tier = entitlementOf(data.metadata);
      const plan = data.metadata?.plan || null;
      const customerId = typeof data.customer === 'string' ? data.customer : data.customer?.id;

      if (data.mode === 'payment') {
        // One-time pass (e.g. Season): active until the pass runs out. No
        // Stripe subscription id, so access ends exactly at period end.
        if (data.payment_status !== 'paid') return Response.json({ received: true, pending: true });
        await upsertSubscription(base44, {
          email, tier, plan, status: 'active', customerId, subscriptionId: null,
          periodEnd: passEnd(data.metadata?.pass_days),
        });
      } else {
        const subscriptionId = typeof data.subscription === 'string' ? data.subscription : data.subscription?.id;
        await upsertSubscription(base44, {
          email, tier, plan, status: 'active', customerId, subscriptionId, periodEnd: null,
        });
      }
    } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const sub = data;
      const email = ownerEmailOf(sub) || await getCustomerEmail(stripe, sub.customer);
      await upsertSubscription(base44, {
        email,
        tier: entitlementOf(sub.metadata),
        plan: sub.metadata?.plan || null,
        status: mapStatus(sub.status),
        customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
        subscriptionId: sub.id,
        periodEnd: periodEndOf(sub),
      });
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = data;
      const email = ownerEmailOf(sub) || await getCustomerEmail(stripe, sub.customer);
      const row = await findSubscriptionRow(base44, email, sub.id);
      if (row) await base44.asServiceRole.entities.Subscription.update(row.id, { status: 'cancelled' });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripe webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
