export function sortBadgesForDisplay(badges, earnedCodes, rarityFilter, rarityOrder, sortMode = 'rarity', earnedRecords = {}) {
  const rarityRank = Object.fromEntries(rarityOrder.map((rarity, index) => [rarity, index]));
  const filtered = rarityFilter === 'all'
    ? badges
    : badges.filter((badge) => badge.rarity === rarityFilter);

  const earnedFirst = (a, b) => (earnedCodes.has(a.code) ? 0 : 1) - (earnedCodes.has(b.code) ? 0 : 1);

  if (sortMode === 'name') {
    return [...filtered].sort((a, b) => earnedFirst(a, b) || a.title.localeCompare(b.title));
  }
  if (sortMode === 'date') {
    return [...filtered].sort((a, b) => {
      const e = earnedFirst(a, b);
      if (e) return e;
      const ad = earnedRecords[a.code]?.earned_at || '';
      const bd = earnedRecords[b.code]?.earned_at || '';
      // most-recently-earned first; unearned fall after (handled by earnedFirst)
      return bd.localeCompare(ad);
    });
  }
  // rarity (default) — highest rarity first within earned/locked groups
  return [...filtered].sort((a, b) => earnedFirst(a, b) || (rarityRank[b.rarity] ?? -1) - (rarityRank[a.rarity] ?? -1));
}

const TOP_BADGE_RARITY_RANK = Object.freeze({
  mythic: -1,
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
});

export function selectTopBadges(badges, earnedCodes, limit = 3) {
  return badges
    .filter((badge) => earnedCodes.has(badge.code))
    .sort((first, second) => (
      (TOP_BADGE_RARITY_RANK[first.rarity] ?? Number.MAX_SAFE_INTEGER)
      - (TOP_BADGE_RARITY_RANK[second.rarity] ?? Number.MAX_SAFE_INTEGER)
    ))
    .slice(0, limit);
}