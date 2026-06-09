import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Maps utility endpoint — auth-gated.
 * The Google Maps API key is used server-side only (reverse geocoding in parseSpecimenDictation).
 * This endpoint no longer exposes the key to clients.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Key is used server-side only — not returned to clients
    const hasKey = !!Deno.env.get('GOOGLE_MAPS_API_KEY');
    return Response.json({ ok: hasKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});