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

  it('sorts by name alphabetically within earned and unearned groups', () => {
    const list = [
      { code: 'z_badge', title: 'Zircon Hunter', rarity: 'common' },
      { code: 'a_badge', title: 'Agate Master', rarity: 'rare' },
      { code: 'b_badge', title: 'Beryl Finder', rarity: 'uncommon' },
    ];
    // Earned: z_badge; unearned: a_badge, b_badge
    const result = sortBadgesForDisplay(list, new Set(['z_badge']), 'all', rarityOrder, 'name');
    expect(result.map((b) => b.code)).toEqual(['z_badge', 'a_badge', 'b_badge']);
  });

  it('sorts by date with most-recently-earned first within earned group', () => {
    const list = [
      { code: 'b1', title: 'Badge 1', rarity: 'common' },
      { code: 'b2', title: 'Badge 2', rarity: 'rare' },
      { code: 'b3', title: 'Badge 3', rarity: 'epic' },
    ];
    const earnedRecords = {
      b1: { earned_at: '2025-01-01' },
      b2: { earned_at: '2025-03-01' },
    };
    // Earned: b1, b2. b2 was earned after b1 so b2 comes first. b3 is unearned.
    const result = sortBadgesForDisplay(list, new Set(['b1', 'b2']), 'all', rarityOrder, 'date', earnedRecords);
    expect(result.map((b) => b.code)).toEqual(['b2', 'b1', 'b3']);
  });
});