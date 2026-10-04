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