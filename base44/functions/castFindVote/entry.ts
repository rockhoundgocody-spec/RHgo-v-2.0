import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { weekKey } from "../../shared/weekKey.ts";

/**
 * Cast or change a user's single vote for the current week's Find of the Week ballot.
 * One vote per user per ISO week is enforced server-side: an existing vote for the
 * same week is updated in place rather than creating a duplicate.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const entryId = body?.entry_id;
    if (!entryId) return Response.json({ error: "Missing entry_id" }, { status: 400 });

    const entry = await base44.entities.StreamIdentification.get(entryId);
    if (!entry || !entry.confirmed)
      return Response.json({ error: "Entry is not a confirmed find" }, { status: 400 });

    const wk = weekKey(new Date());
    const existing = await base44.entities.FindVote.filter({
      week_key: wk,
      voter_email: user.email,
    });
    if (existing && existing.length > 0) {
      const old = existing[0];
      if (old.entry_id === entryId)
        return Response.json({ ok: true, unchanged: true });
      await base44.entities.FindVote.update(old.id, {
        entry_id: entryId,
        voted_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, changed: true });
    }

    await base44.entities.FindVote.create({
      week_key: wk,
      voter_email: user.email,
      voter_name: user.full_name || user.email.split("@")[0],
      entry_id: entryId,
      voted_at: new Date().toISOString(),
    });
    return Response.json({ ok: true, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}