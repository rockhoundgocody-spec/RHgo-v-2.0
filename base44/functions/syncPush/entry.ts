// POST /sync/push — body: { events: OutboxEvent[], cursor?: string }
// Returns: { acked: [{event_id, rev}], rejected: [{event_id, reason}], conflicts: [...], new_cursor }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { applyEvents, MAX_BATCH } from '../../shared/applyEvents.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const events = Array.isArray(body?.events) ? body.events : null;
    if (!events) return Response.json({ error: 'events[] required' }, { status: 400 });
    if (events.length > MAX_BATCH) {
      return Response.json({ error: `batch too large — max ${MAX_BATCH} events` }, { status: 413 });
    }

    const result = await applyEvents({
      entities: base44.entities,
      ownerEmail: user.email,
      events,
      cursor: typeof body.cursor === 'string' ? body.cursor : null,
    });
    return Response.json(result);
  } catch (error) {
    console.error('syncPush failed:', error?.message);
    return Response.json({ error: 'sync push failed' }, { status: 500 });
  }
}