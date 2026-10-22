export function sortBadgesForDisplay(badges, earnedCodes, rarityFilter, rarityOrder, sortMode = 'rarity', earnedRecords = {}) {
  const rarityRankMap = new Map(rarityOrder.map((rarity, index) => [rarity, index]));
  const filtered = rarityFilter === 'all'
    ? badges
    : badges.filter((badge) => badge.rarity === rarityFilter);

  // Performance Optimization (Bolt): Pre-decorate filtered badges in a single O(N) pass to calculate sort keys.
  // Eliminates O(N log N) repeated Set.has() calls, object property lookups, and localeCompare invocations in the sort loop.
  const decorated = filtered.map((badge) => ({
    badge,
    earnedGroup: earnedCodes.has(badge.code) ? 0 : 1,
    rarityRank: rarityRankMap.get(badge.rarity) ?? -1,
    earnedAt: earnedRecords[badge.code]?.earned_at || '',
    title: badge.title || '',
  }));

  if (sortMode === 'name') {
    decorated.sort((a, b) => a.earnedGroup - b.earnedGroup || a.title.localeCompare(b.title));
  } else if (sortMode === 'date') {
    // Most-recently-earned first; unearned fall after (handled by earnedGroup)
    decorated.sort((a, b) => a.earnedGroup - b.earnedGroup || b.earnedAt.localeCompare(a.earnedAt));
  } else {
    // Rarity (default) — highest rarity first within earned/locked groups
    decorated.sort((a, b) => a.earnedGroup - b.earnedGroup || b.rarityRank - a.rarityRank);
  }

  return decorated.map((item) => item.badge);
}