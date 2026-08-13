import Stripe from 'npm:stripe@14.25.0';

/**
 * Validates that redirect destinations belong strictly to permitted origins
 */
function isValidRedirectTarget(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    // Permitted origins: localhost, 127.0.0.1, rhgo.base44.app, rhgo2.base44.app, or domains ending in .base44.app
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'rhgo.base44.app' ||
      hostname === 'rhgo2.base44.app' ||
      hostname.endsWith('.base44.app')
    );
  } catch (_e) {
    // Return false if URL parsing fails
    return false;
  }
}

/**
 * createCheckoutSession — starts a Stripe Checkout (subscription mode) for a
 * RockHound-GO tier. Public app (no login required), so we do NOT call
 * base44.auth.me(); the caller may pass an optional customerEmail.
 *
 * Body: { priceId, successUrl, cancelUrl, tier, customerEmail? }
 * Returns: { url } — redirect the browser there.
 *
 * metadata.tier is propagated to the subscription so the webhook can sync the
 * Subscription entity without needing a price-id→tier map.
 */
Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { priceId, successUrl, cancelUrl, tier, customerEmail } = body || {};

    if (!priceId) return Response.json({ error: 'priceId is required' }, { status: 400 });
    if (!successUrl || !cancelUrl) return Response.json({ error: 'successUrl and cancelUrl are required' }, { status: 400 });

    if (!isValidRedirectTarget(successUrl) || !isValidRedirectTarget(cancelUrl)) {
      return Response.json({ error: 'Invalid redirect target for successUrl or cancelUrl' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Derive tier SERVER-SIDE from the price's product — never trust the
    // client-supplied `tier` (a caller could buy the cheap price but claim
    // the 'family' entitlement in the webhook otherwise).
    const PRODUCT_TIERS: Record<string, string> = {
      'prod_UoyNC9AKOB5ZDh': 'field_pro',
      'prod_UoyNPk13OVCr11': 'family',
    };
    const price = await stripe.prices.retrieve(priceId);
    const productId = typeof price.product === 'string' ? price.product : price.product?.id;
    const resolvedTier = PRODUCT_TIERS[productId] || 'field_pro';
    if (tier && tier !== resolvedTier) {
      console.warn(`createCheckoutSession: client tier '${tier}' ignored; price maps to '${resolvedTier}'`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        tier: resolvedTier,
      },
      // Propagate tier onto the SUBSCRIPTION object too — without this,
      // customer.subscription.updated events carry no metadata.tier and the
      // webhook silently downgrades 'family' subscribers to the default tier
      // on every renewal/update.
      subscription_data: {
        metadata: { tier: resolvedTier },
      },
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
