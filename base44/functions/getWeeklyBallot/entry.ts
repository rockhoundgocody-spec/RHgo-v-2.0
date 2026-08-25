import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { weekKey, weekRange } from "../../shared/weekKey.ts";

const RARITY_RANK: Record<string, number> = {
  legendary: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

/**
 * Returns the current week's Find of the Week ballot: confirmed identifications
 * whose confirmed_at falls inside this ISO week, ranked by rarity then confidence,
 * de-duped to one entry per stream, each with its live vote tally. Also returns
 * the caller's current vote (my_vote) so the UI can show the "Voted" state.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const now = new Date();
    const wk = weekKey(now);
    const { start, end } = weekRange(now);

    const confirmed = await base44.entities.StreamIdentification.filter({
      confirmed: true,
    });
    const eligible = confirmed.filter((x) => {
      if (!x.confirmed_at) return false;
      const at = new Date(x.confirmed_at);
      return at >= start && at < end;
    });

    eligible.sort((a, b) => {
      const ra = RARITY_RANK[b.rarity] || 1;
      const rb = RARITY_RANK[a.rarity] || 1;
      if (ra !== rb) return ra - rb;
      return (b.confidence || 0) - (a.confidence || 0);
    });

    // De-duplicate: one entry per stream so a single host can't flood the ballot.
    const seenStreams = new Set<string>();
    const entries: typeof eligible = [];
    for (const x of eligible) {
      if (x.stream_id) {
        if (seenStreams.has(x.stream_id)) continue;
        seenStreams.add(x.stream_id);
      }
      entries.push(x);
      if (entries.length >= 12) break;
    }

    // Vote tallies for the week.
    const votes = await base44.entities.FindVote.filter({ week_key: wk });
    const tally: Record<string, number> = {};
    let myVote: string | null = null;
    for (const v of votes) {
      tally[v.entry_id] = (tally[v.entry_id] || 0) + 1;
      if (user && v.voter_email === user.email) myVote = v.entry_id;
    }

    // Hydrate host names from the parent streams.
    const streamIds = [...new Set(entries.map((e) => e.stream_id).filter(Boolean))];
    const streams: Record<string, { host_name?: string }> = {};
    for (const sid of streamIds) {
      const s = await base44.entities.LiveStream.get(sid).catch(() => null);
      if (s) streams[sid] = { host_name: s.host_name };
    }

    const result = entries.map((e) => ({
      id: e.id,
      mineral_name: e.mineral_name,
      image_url: e.image_url,
      rarity: e.rarity,
      confidence: e.confidence,
      description: e.description,
      host_name: streams[e.stream_id]?.host_name || (e.owner_email || "").split("@")[0] || "unknown",
      stream_id: e.stream_id,
      votes: tally[e.id] || 0,
    }));

    // Live ranking: sort by votes desc, ties broken by rarity then confidence.
    result.sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      const ra = RARITY_RANK[b.rarity] || 1;
      const rb = RARITY_RANK[a.rarity] || 1;
      if (ra !== rb) return ra - rb;
      return (b.confidence || 0) - (a.confidence || 0);
    });
    result.forEach((r, i) => { (r as any).rank = i + 1; });

    return Response.json({
      week_key: wk,
      closes_at: end.toISOString(),
      entries: result,
      my_vote: myVote,
      total_votes: votes.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}