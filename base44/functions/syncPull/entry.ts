// GET /sync/pull — body: { cursor?: string, limit?: number }
// Returns: { changes: [{ entity, op: 'upsert'|'delete', record }], cursor, has_more }
// Cursor is the server updated_date high-water mark; tombstones (deleted_at) are included.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { nextCursor } from '../../shared/applyEvents.ts';

const MAX_LIMIT = 200;
const ENTITIES = [
  ['find', 'SyncFind'],
  ['photo', 'SyncPhoto'],
  ['id_result', 'SyncIdResult'],
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const cursor = typeof body?.cursor === 'string' && body.cursor ? body.cursor : null;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(body?.limit) || 100));

    const query = { owner_email: user.email };
    if (cursor) query.updated_date = { $gt: cursor };

    const batches = await Promise.all(
      ENTITIES.map(async ([entity, name]) => {
        const rows = await base44.entities[name].filter(query, 'updated_date', limit + 1);
        return rows.map((record) => ({
          entity,
          op: record.deleted_at ? 'delete' : 'upsert',
          record,
        }));
      })
    );

    const merged = batches.flat().sort((a, b) => (a.record.updated_date < b.record.updated_date ? -1 : a.record.updated_date > b.record.updated_date ? 1 : 0));
    const changes = merged.slice(0, limit);

    return Response.json({
      changes,
      cursor: nextCursor(changes.map((c) => c.record), cursor),
      has_more: merged.length > limit,
    });
  } catch (error) {
    console.error('syncPull failed:', error?.message);
    return Response.json({ error: 'sync pull failed' }, { status: 500 });
  }
}