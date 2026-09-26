import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';

/**
 * stripeWebhook — keeps the Subscription entity in sync with Stripe.
 *
 * Events handled:
 *   checkout.session.completed        → activate subscription (tier from metadata)
 *   customer.subscription.updated      → refresh status + current_period_end
 *   customer.subscription.deleted      → mark cancelled
 *
 * The subscription's tier is read from metadata.tier (set by createCheckoutSession
 * and propagated by Stripe). We never trust the client for tier.
 *
 * Uses the service role to write Subscription records (the webhook has no user auth).
 */
const TIER_DEFAULT = 'field_pro';

function mapStatus(stripeStatus) {
  if (stripeStatus === 'active') return 'active';
  if (stripeStatus === 'trialing') return 'trialing';
  if (stripeStatus === 'past_due') return 'past_due';
  if (stripeStatus === 'canceled' || stripeStatus === 'unpaid') return 'cancelled';
  return stripeStatus || 'active';
}

async function getCustomerEmail(stripe, customerId) {
  if (!customerId) return null;
  try {
    const c = await stripe.customers.retrieve(customerId);
    return c?.email || null;
  } catch { return null; }
}

async function upsertSubscription(base44, email, tier, status, customerId, subscriptionId, periodEnd) {
  if (!email) return;
  const rows = await base44.asServiceRole.entities.Subscription.filter({ owner_email: email });
  const existing = rows?.[0];
  const patch = {
    tier: tier || TIER_DEFAULT,
    status,
    stripe_customer_id: customerId || undefined,
    stripe_subscription_id: subscriptionId || undefined,
    ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
  };
  if (existing) {
    await base44.asServiceRole.entities.Subscription.update(existing.id, patch);
  } else {
    await base44.asServiceRole.entities.Subscription.create({
      owner_email: email,
      ...patch,
    });
  }
}

async function setSubscriptionStatus(base44, email, status) {
  if (!email) return;
  const rows = await base44.asServiceRole.entities.Subscription.filter({ owner_email: email });
  if (rows?.[0]) await base44.asServiceRole.entities.Subscription.update(rows[0].id, { status });
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
      const email = data.customer_email || data.customer_details?.email;
      const tier = data.metadata?.tier || TIER_DEFAULT;
      await upsertSubscription(base44, email, tier, 'active', data.customer, data.subscription, null);
    } else if (event.type === 'customer.subscription.updated') {
      const sub = data;
      const email = await getCustomerEmail(stripe, sub.customer);
      const tier = sub.metadata?.tier || TIER_DEFAULT;
      const status = mapStatus(sub.status);
      const periodEnd = sub.current_period_end;
      await upsertSubscription(base44, email, tier, status, sub.customer, sub.id, periodEnd);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = data;
      const email = await getCustomerEmail(stripe, sub.customer);
      await setSubscriptionStatus(base44, email, 'cancelled');
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripe webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});