export function sortBadgesForDisplay(badges, earnedCodes, rarityFilter, rarityOrder) {
  const rarityRank = Object.fromEntries(rarityOrder.map((rarity, index) => [rarity, index]));
  const filtered = rarityFilter === 'all'
    ? badges
    : badges.filter((badge) => badge.rarity === rarityFilter);

  return [...filtered].sort((first, second) => {
    const firstEarned = earnedCodes.has(first.code) ? 0 : 1;
    const secondEarned = earnedCodes.has(second.code) ? 0 : 1;
    if (firstEarned !== secondEarned) return firstEarned - secondEarned;
    return (rarityRank[second.rarity] ?? -1) - (rarityRank[first.rarity] ?? -1);
  });
}

const TOP_BADGE_RARITY_RANK = Object.freeze({
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
