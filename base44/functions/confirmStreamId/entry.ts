import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

/**
 * Host confirms a stream identification so it enters the Find of the Week ballot.
 * Anti-gaming gate: the identification must be owned by the caller, come from a
 * LiveStream owned by the caller, and have confidence >= 0.70. Unconfirmed or
 * low-confidence auto-scans never reach the ballot.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    const ident = await base44.entities.StreamIdentification.get(id);
    if (!ident) return Response.json({ error: "Not found" }, { status: 404 });
    if (ident.owner_email !== user.email)
      return Response.json({ error: "Only the host can confirm their own find" }, { status: 403 });
    if ((ident.confidence || 0) < 0.7)
      return Response.json({ error: "Confidence below 70% — not eligible for the ballot" }, { status: 400 });
    if (ident.confirmed)
      return Response.json({ ok: true, already: true, identification: ident });

    if (!ident.stream_id)
      return Response.json({ error: "Identification has no stream context" }, { status: 400 });
    const stream = await base44.entities.LiveStream.get(ident.stream_id).catch(() => null);
    if (!stream || stream.owner_email !== user.email)
      return Response.json({ error: "Stream not owned by you" }, { status: 403 });

    const updated = await base44.entities.StreamIdentification.update(id, {
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    });
    return Response.json({ ok: true, identification: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}