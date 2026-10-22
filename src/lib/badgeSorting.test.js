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
    const testBadges = [
      { code: 'b', title: 'Beta', rarity: 'common' },
      { code: 'a', title: 'Alpha', rarity: 'rare' },
      { code: 'c', title: 'Charlie', rarity: 'legendary' },
    ];
    // 'b' is earned -> comes first, 'a' and 'c' sorted by name -> 'Alpha', 'Charlie'
    const sorted = sortBadgesForDisplay(testBadges, new Set(['b']), 'all', rarityOrder, 'name');
    expect(sorted.map((b) => b.code)).toEqual(['b', 'a', 'c']);
  });

  it('sorts by date earned descending within earned group', () => {
    const testBadges = [
      { code: 'badge1', rarity: 'common' },
      { code: 'badge2', rarity: 'rare' },
      { code: 'badge3', rarity: 'legendary' },
    ];
    const earnedRecords = {
      badge1: { earned_at: '2026-01-01T10:00:00Z' },
      badge2: { earned_at: '2026-02-15T12:00:00Z' },
    };
    const sorted = sortBadgesForDisplay(
      testBadges,
      new Set(['badge1', 'badge2']),
      'all',
      rarityOrder,
      'date',
      earnedRecords
    );
    expect(sorted.map((b) => b.code)).toEqual(['badge2', 'badge1', 'badge3']);
  });

  it('handles empty badges array safely', () => {
    expect(sortBadgesForDisplay([], new Set(), 'all', rarityOrder)).toEqual([]);
  });
});