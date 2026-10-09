import { createClientFromRequest } from '@base44/sdk';

/**
 * Maps key endpoint — auth-gated.
 * Returns the Google Maps JavaScript API key to signed-in users so the
 * frontend can load the new Maps JS API (Advanced Markers). Maps JS keys
 * are designed for browser use and should be referrer-restricted in the
 * Google Cloud console.
 */
export async function handleGetMapsKeyRequest(
  req: Request,
  opts?: {
    createClientFromRequest?: typeof createClientFromRequest;
    envGet?: (key: string) => string | undefined;
  }
): Promise<Response> {
  try {
    const clientFactory = opts?.createClientFromRequest || createClientFromRequest;
    const base44 = clientFactory(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const getEnv =
      opts?.envGet ||
      ((key: string) =>
        typeof Deno !== 'undefined'
          ? Deno.env.get(key)
          : (globalThis.process?.env?.[key] as string | undefined));
    const key = getEnv('GOOGLE_MAPS_API_KEY') || getEnv('google_maps') || null;
    return Response.json({ ok: !!key, key });
  } catch (error) {
    console.error('getMapsKey error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve((req) => handleGetMapsKeyRequest(req));
}
