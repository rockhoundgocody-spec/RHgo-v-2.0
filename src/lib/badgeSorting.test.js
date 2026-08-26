import { describe, expect, it } from 'vitest';
import { selectTopBadges, sortBadgesForDisplay } from './badgeSorting.js';

const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const badges = [
  { code: 'common', rarity: 'common' },
  { code: 'rare', rarity: 'rare' },
  { code: 'legendary', rarity: 'legendary' },
];

describe('sortBadgesForDisplay', () => {
  it('puts earned badges first and then orders by descending rarity', () => {
    expect(sortBadgesForDisplay(badges, new Set(['common']), 'all', rarityOrder)
      .map((badge) => badge.code)).toEqual(['common', 'legendary', 'rare']);
  });

  it('filters without mutating the catalog', () => {
    const original = [...badges];
    expect(sortBadgesForDisplay(badges, new Set(), 'rare', rarityOrder)).toEqual([badges[1]]);
    expect(badges).toEqual(original);
  });
});

describe('selectTopBadges', () => {
  it('selects earned badges by rarity without mutating input', () => {
    const catalog = [
      { code: 'common', rarity: 'common' },
      { code: 'legendary', rarity: 'legendary' },
      { code: 'rare', rarity: 'rare' },
      { code: 'epic', rarity: 'epic' },
      { code: 'locked', rarity: 'legendary' },
    ];
    const original = [...catalog];

    expect(selectTopBadges(catalog, new Set(['common', 'legendary', 'rare', 'epic']))).toEqual([
      catalog[1],
      catalog[3],
      catalog[2],
    ]);
    expect(catalog).toEqual(original);
  });
});
