import Stripe from 'npm:stripe@14.25.0';

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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        tier: tier || 'field_pro',
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