import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Maps key endpoint — auth-gated.
 * Returns the Google Maps JavaScript API key to signed-in users so the
 * frontend can load the new Maps JS API (Advanced Markers). Maps JS keys
 * are designed for browser use and should be referrer-restricted in the
 * Google Cloud console.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const key = Deno.env.get('GOOGLE_MAPS_API_KEY') || Deno.env.get('google_maps') || null;
    return Response.json({ ok: !!key, key });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});