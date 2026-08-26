import { describe, expect, it } from 'vitest';
import { sortBadgesForDisplay } from './badgeSorting.js';

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
