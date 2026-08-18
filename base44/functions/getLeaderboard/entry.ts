import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public leaderboard aggregate — service role reads across all users.
// Ranks collectors by (a) unique mineral discoveries and (b) total specimen weight.
// Only aggregate counts + display names are exposed — never specimen locations/coords.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Optimize data transfer and memory footprint by requesting only required fields
    const [specimens, weights, users, profiles] = await Promise.all([
      base44.asServiceRole.entities.Specimen.list('-created_date', 5000, 0, ['created_by_id', 'mineral_name']),
      base44.asServiceRole.entities.CollectionWeight.list('-created_date', 5000, 0, ['owner_email', 'total_weight_lbs']),
      base44.asServiceRole.entities.User.list('-created_date', 5000, 0, ['id', 'full_name', 'email']),
      base44.asServiceRole.entities.PlayerProfile.list('-created_date', 5000, 0, ['owner_email', 'avatar_url']),
    ]);

    // user id -> display info
    const userMap = {};
    for (const u of users) {
      userMap[u.id] = {
        name: u.full_name || (u.email || 'collector').split('@')[0],
        email: (u.email || '').toLowerCase(),
      };
    }
    const profMap = {};
    for (const p of profiles) profMap[(p.owner_email || '').toLowerCase()] = p;

    // unique minerals + specimen count per collector (Specimen is attributed by created_by_id)
    const stats = {};
    for (const s of specimens) {
      const uid = s.created_by_id;
      if (!uid) continue;
      if (!stats[uid]) stats[uid] = { minerals: new Set(), count: 0 };
      stats[uid].count++;
      const m = (s.mineral_name || '').toLowerCase().trim();
      if (m) stats[uid].minerals.add(m);
    }

    // total weight per collector (CollectionWeight is keyed by owner_email, summed across years)
    const weightByEmail = {};
    for (const w of weights) {
      const e = (w.owner_email || '').toLowerCase().trim();
      if (!e) continue;
      weightByEmail[e] = (weightByEmail[e] || 0) + (w.total_weight_lbs || 0);
    }

    const rows = Object.entries(stats).map(([uid, st]) => {
      const u = userMap[uid] || { name: 'Unknown collector', email: '' };
      const prof = profMap[u.email];
      return {
        user_id: uid,
        name: u.name,
        email: u.email,
        avatar_url: prof?.avatar_url || null,
        unique_minerals: st.minerals.size,
        specimen_count: st.count,
        total_weight_lbs: Math.round((weightByEmail[u.email] || 0) * 10) / 10,
      };
    });

    return Response.json({ rows, total_collectors: rows.length });
  } catch (error) {
    console.error('getLeaderboard error', error);
    return Response.json({ error: error.message, rows: [], total_collectors: 0 }, { status: 500 });
  }
});
