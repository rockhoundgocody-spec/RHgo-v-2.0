export function sortBadgesForDisplay(badges, earnedCodes, rarityFilter, rarityOrder) {
  const filtered = rarityFilter === 'all'
    ? badges
    : badges.filter((badge) => badge.rarity === rarityFilter);

  return [...filtered].sort((first, second) => {
    const firstEarned = earnedCodes.has(first.code) ? 0 : 1;
    const secondEarned = earnedCodes.has(second.code) ? 0 : 1;
    if (firstEarned !== secondEarned) return firstEarned - secondEarned;
    return rarityOrder.indexOf(second.rarity) - rarityOrder.indexOf(first.rarity);
  });
}
