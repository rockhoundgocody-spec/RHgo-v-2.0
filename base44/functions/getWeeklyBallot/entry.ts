import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { weekKey, weekRange } from "../../shared/weekKey.ts";

const RARITY_RANK: Record<string, number> = {
  legendary: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

/**
 * Returns the current week's Find of the Week ballot sourced from community
 * find-share posts (Post.post_type === 'find_share') created this ISO week.
 * Entries are de-duplicated to one per author so a single user can't flood the
 * ballot, then ranked live by community vote count (ties broken by rarity).
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const now = new Date();
    const wk = weekKey(now);
    const { start, end } = weekRange(now);

    const posts = await base44.entities.Post.filter({ post_type: "find_share" });
    const eligible = posts.filter((p) => {
      if (!p.created_date) return false;
      const at = new Date(p.created_date);
      return at >= start && at < end;
    });

    eligible.sort((a, b) => {
      const ra = RARITY_RANK[b.rarity] || 1;
      const rb = RARITY_RANK[a.rarity] || 1;
      if (ra !== rb) return ra - rb;
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    });

    // De-duplicate: one entry per author.
    const seenAuthors = new Set<string>();
    const entries: typeof eligible = [];
    for (const p of eligible) {
      const author = p.owner_email || p.author_name;
      if (author && seenAuthors.has(author)) continue;
      if (author) seenAuthors.add(author);
      entries.push(p);
      if (entries.length >= 12) break;
    }

    const votes = await base44.entities.FindVote.filter({ week_key: wk });
    const tally: Record<string, number> = {};
    let myVote: string | null = null;
    for (const v of votes) {
      tally[v.entry_id] = (tally[v.entry_id] || 0) + 1;
      if (user && v.voter_email === user.email) myVote = v.entry_id;
    }

    const unrankedResult = entries.map((p) => ({
      id: p.id,
      mineral_name: p.mineral_name,
      image_url: p.image_url,
      rarity: p.rarity,
      body: p.body,
      author_name: p.author_name || (p.owner_email || "").split("@")[0] || "unknown",
      location_label: p.location_label,
      votes: tally[p.id] || 0,
    }));

    unrankedResult.sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      const ra = RARITY_RANK[b.rarity] || 1;
      const rb = RARITY_RANK[a.rarity] || 1;
      if (ra !== rb) return ra - rb;
      return 0;
    });

    const result = unrankedResult.map((r, i) => ({
      ...r,
      rank: i + 1,
    }));

    return Response.json({
      week_key: wk,
      closes_at: end.toISOString(),
      entries: result,
      my_vote: myVote,
      total_votes: votes.length,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
