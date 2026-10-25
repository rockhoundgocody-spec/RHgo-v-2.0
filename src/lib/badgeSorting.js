export function sortBadgesForDisplay(badges, earnedCodes, rarityFilter, rarityOrder, sortMode = 'rarity', earnedRecords = {}) {
  if (!badges || !badges.length) return [];

  const rarityRank = Object.fromEntries((rarityOrder || []).map((rarity, index) => [rarity, index]));
  const filtered = rarityFilter === 'all'
    ? badges
    : badges.filter((badge) => badge.rarity === rarityFilter);

  // Decorate-Sort-Undecorate (Schwartzian transform):
  // Decorate items in a single O(N) mapping pass with precomputed primitive keys
  // to avoid O(N log N) repeated Set lookups, object indexing, and locale/date string comparisons in .sort().
  const decorated = filtered.map((badge) => ({
    badge,
    earnedGroup: earnedCodes?.has(badge.code) ? 0 : 1,
    rarityVal: rarityRank[badge.rarity] ?? -1,
    title: badge.title || '',
    earnedAt: earnedRecords?.[badge.code]?.earned_at || '',
  }));

  if (sortMode === 'name') {
    decorated.sort((a, b) => {
      if (a.earnedGroup !== b.earnedGroup) return a.earnedGroup - b.earnedGroup;
      return a.title.localeCompare(b.title);
    });
  } else if (sortMode === 'date') {
    decorated.sort((a, b) => {
      if (a.earnedGroup !== b.earnedGroup) return a.earnedGroup - b.earnedGroup;
      if (a.earnedAt !== b.earnedAt) return b.earnedAt > a.earnedAt ? 1 : -1;
      return 0;
    });
  } else {
    // rarity (default) — highest rarity first within earned/locked groups
    decorated.sort((a, b) => {
      if (a.earnedGroup !== b.earnedGroup) return a.earnedGroup - b.earnedGroup;
      return b.rarityVal - a.rarityVal;
    });
  }

  return decorated.map((d) => d.badge);
}
