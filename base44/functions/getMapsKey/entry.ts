import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Maps utility endpoint — auth-gated.
 * Returns the Google Maps JS API key to authenticated clients so the Explore
 * map can render with the Google Maps JS API. The key is referrer-restricted
 * in Google Cloud Console, which is the standard client-side protection.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const key = Deno.env.get('google_maps') || Deno.env.get('GOOGLE_MAPS_API_KEY');
    return Response.json({ key });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});