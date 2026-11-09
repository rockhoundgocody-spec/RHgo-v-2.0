// Performance Optimization: Decorate-sort-undecorate (Schwartzian transform)
// Precomputing sort keys in a single O(N) pass avoids repeated Set.has() calls,
// object property lookups, and dictionary rank index searches in O(N log N) comparator executions.
export function sortBadgesForDisplay(badges, earnedCodes, rarityFilter, rarityOrder, sortMode = 'rarity', earnedRecords = {}) {
  const rarityRank = Object.fromEntries(rarityOrder.map((rarity, index) => [rarity, index]));
  const filtered = rarityFilter === 'all'
    ? badges
    : badges.filter((badge) => badge.rarity === rarityFilter);

  const decorated = filtered.map((badge) => ({
    badge,
    earned: earnedCodes.has(badge.code) ? 0 : 1,
    name: badge.title || '',
    date: earnedRecords[badge.code]?.earned_at || '',
    rarity: rarityRank[badge.rarity] ?? -1,
  }));

  if (sortMode === 'name') {
    decorated.sort((a, b) => (a.earned - b.earned) || a.name.localeCompare(b.name));
  } else if (sortMode === 'date') {
    decorated.sort((a, b) => (a.earned - b.earned) || b.date.localeCompare(a.date));
  } else {
    // rarity (default) — highest rarity first within earned/locked groups
    decorated.sort((a, b) => (a.earned - b.earned) || (b.rarity - a.rarity));
  }

  return decorated.map((d) => d.badge);
}