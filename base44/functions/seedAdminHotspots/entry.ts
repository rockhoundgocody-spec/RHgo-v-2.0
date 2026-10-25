import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ADMIN_SEED_HOTSPOTS } from '../../shared/adminSeedHotspots.ts';

/** Admin-only. {dry_run: true} returns the count; otherwise inserts the curated sites server-side. */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (body?.dry_run) return Response.json({ count: ADMIN_SEED_HOTSPOTS.length });

  await base44.asServiceRole.entities.Hotspot.bulkCreate(ADMIN_SEED_HOTSPOTS);
  return Response.json({ inserted: ADMIN_SEED_HOTSPOTS.length });
}