/**
 * Sort badges for display.
 * Performance Optimization: Decorates badges in a single O(N) pass with precomputed
 * primitive sort keys before sorting to avoid repeated Set lookups, Map lookups,
 * property accesses, and string comparisons during O(N log N) sort comparator runs.
 */
export function sortBadgesForDisplay(badges, earnedCodes, rarityFilter, rarityOrder, sortMode = 'rarity', earnedRecords = {}) {
  const rarityRank = Object.fromEntries(rarityOrder.map((rarity, index) => [rarity, index]));
  const filtered = rarityFilter === 'all'
    ? badges
    : badges.filter((badge) => badge.rarity === rarityFilter);

  // Decorate items in a single O(N) pass
  const decorated = filtered.map((badge) => {
    const isEarned = earnedCodes.has(badge.code) ? 0 : 1;
    const title = badge.title || '';
    const earnedAt = earnedRecords[badge.code]?.earned_at || '';
    const rank = rarityRank[badge.rarity] ?? -1;
    return { badge, isEarned, title, earnedAt, rank };
  });

  if (sortMode === 'name') {
    decorated.sort((a, b) => a.isEarned - b.isEarned || a.title.localeCompare(b.title));
  } else if (sortMode === 'date') {
    decorated.sort((a, b) => a.isEarned - b.isEarned || b.earnedAt.localeCompare(a.earnedAt));
  } else {
    // rarity (default) — highest rarity first within earned/locked groups
    decorated.sort((a, b) => a.isEarned - b.isEarned || b.rank - a.rank);
  }

  return decorated.map((d) => d.badge);
}