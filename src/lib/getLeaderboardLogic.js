// Extracted pure aggregation logic for getLeaderboard function

export function processLeaderboardData({ specimens = [], weights = [], users = [], profiles = [] }) {
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

  return { rows, total_collectors: rows.length };
}
