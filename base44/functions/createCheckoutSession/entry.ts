import Stripe from 'npm:stripe@14.25.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { isValidRedirectTarget } from './redirectValidation.ts';
import { resolveCheckoutPrice } from './tierPricing.ts';

/**
 * createCheckoutSession — starts Stripe Checkout for a Pricing-page plan.
 *
 * Body: { successUrl, cancelUrl, tier }   (tier = plan id: season | hound |
 *       steward | club, or legacy field_pro | family)
 * Returns: { url } — redirect the browser there.
 *
 * The buyer must be signed in: the checkout is bound to their account
 * (customer email, client_reference_id and metadata.owner_email), so the
 * webhook credits the subscription to the account that paid — not to
 * whatever email was typed into Stripe.
 *
 * Price and entitlement come only from the server plan catalog
 * (tierPricing.ts). Recurring prices open a subscription; a one-time price
 * is sold as a fixed-length pass (plan.passDays).
 */
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { priceId: requestedPriceId, successUrl, cancelUrl, tier } = body || {};

    if (!successUrl || !cancelUrl) return Response.json({ error: 'successUrl and cancelUrl are required' }, { status: 400 });

    if (!isValidRedirectTarget(successUrl) || !isValidRedirectTarget(cancelUrl)) {
      return Response.json({ error: 'Invalid successUrl or cancelUrl redirect target' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) {
      return Response.json({ error: 'Sign in to subscribe', code: 'auth_required' }, { status: 401 });
    }

    const pricing = resolveCheckoutPrice(tier, requestedPriceId, (name) => secrets.get(name));
    if (!pricing.ok) return Response.json({ error: pricing.error, code: pricing.code }, { status: 400 });

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const price = await stripe.prices.retrieve(pricing.priceId);
    if (!price?.active) {
      return Response.json({ error: 'This plan is not available right now', code: 'price_inactive' }, { status: 400 });
    }
    const recurring = price.type === 'recurring';
    if (!recurring && !pricing.passDays) {
      console.error(`createCheckoutSession: ${pricing.plan} is configured with a one-time price`);
      return Response.json({ error: 'This plan is misconfigured', code: 'bad_config' }, { status: 500 });
    }

    // Reuse the buyer's Stripe customer when we already know it, so renewals,
    // upgrades and the billing portal stay on one customer record.
    let existingCustomer: string | null = null;
    try {
      const rows = await base44.asServiceRole.entities.Subscription.filter({ owner_email: user.email }, '-updated_date', 1);
      existingCustomer = (rows?.[0]?.stripe_customer_id as string) || null;
    } catch { /* first purchase */ }

    const metadata: Record<string, string> = {
      base44_app_id: secrets.get('BASE44_APP_ID') || '',
      tier: pricing.entitlement,
      plan: pricing.plan,
      owner_email: user.email,
      owner_id: String(user.id || ''),
      ...(pricing.passDays && !recurring ? { pass_days: String(pricing.passDays) } : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: recurring ? 'subscription' : 'payment',
      line_items: [{ price: pricing.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(user.id || ''),
      ...(existingCustomer ? { customer: existingCustomer } : { customer_email: user.email }),
      metadata,
      // Carry ownership + entitlement onto the subscription too, so
      // customer.subscription.* events can be credited without guessing.
      ...(recurring
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata } }),
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    }, { idempotencyKey: crypto.randomUUID() });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}