import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { safeError } from '../../shared/httpErrors.ts';
import { canSeeExactHotspots, coarsenHotspot } from '../../shared/hotspotPrecision.ts';
import { SEED_HOTSPOT_COORDS } from '../../shared/seedHotspotCoords.ts';

const SORTS = new Set(['-trust_score', '-created_date', 'name']);

/** Login-required hotspot list. Exact lat/lng only for paid (or admin) users not in Stealth Mode. */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 200, 1), 2000);
    const sort = SORTS.has(body?.sort) ? body.sort : '-trust_score';

    const exact = await canSeeExactHotspots(base44, user);

    const rows = await base44.asServiceRole.entities.Hotspot.list(sort, limit);
    const hotspots = (rows || []).map((h: Record<string, unknown>) => exact ? { ...h, coords_precision: 'exact' } : coarsenHotspot(h));
    // Exact sample-site coordinates only for users allowed exact precision.
    const seed_coords = exact ? SEED_HOTSPOT_COORDS : [];
    return Response.json({ hotspots, seed_coords, precision: exact ? 'exact' : 'approximate' });
  } catch (error) {
    return safeError('getHotspots', error);
  }
}