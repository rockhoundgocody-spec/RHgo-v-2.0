import { describe, expect, it } from 'vitest';
import { sortBadgesForDisplay } from './badgeSorting.js';

const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const badges = [
  { code: 'b1', title: 'Beta Badge', rarity: 'common' },
  { code: 'b2', title: 'Alpha Badge', rarity: 'rare' },
  { code: 'b3', title: 'Gamma Badge', rarity: 'legendary' },
];

describe('sortBadgesForDisplay', () => {
  it('puts earned badges first and then orders by descending rarity (default rarity mode)', () => {
    const earned = new Set(['b1']);
    const result = sortBadgesForDisplay(badges, earned, 'all', rarityOrder, 'rarity');
    expect(result.map((b) => b.code)).toEqual(['b1', 'b3', 'b2']);
  });

  it('filters by rarity without mutating original array', () => {
    const original = [...badges];
    const result = sortBadgesForDisplay(badges, new Set(), 'rare', rarityOrder);
    expect(result).toEqual([badges[1]]);
    expect(badges).toEqual(original);
  });

  it('sorts by name within earned/unearned groups when sortMode is "name"', () => {
    const earned = new Set(['b2', 'b3']); // Alpha (rare), Gamma (legendary)
    const result = sortBadgesForDisplay(badges, earned, 'all', rarityOrder, 'name');
    // Earned: Alpha, Gamma -> ['b2', 'b3']
    // Unearned: Beta -> ['b1']
    expect(result.map((b) => b.code)).toEqual(['b2', 'b3', 'b1']);
  });

  it('sorts by date (most recently earned first) when sortMode is "date"', () => {
    const earned = new Set(['b1', 'b2']);
    const earnedRecords = {
      b1: { earned_at: '2025-01-15T10:00:00Z' },
      b2: { earned_at: '2025-05-20T12:00:00Z' },
    };
    const result = sortBadgesForDisplay(badges, earned, 'all', rarityOrder, 'date', earnedRecords);
    // Earned ordered by earned_at desc: b2 (May), b1 (Jan) -> unearned b3
    expect(result.map((b) => b.code)).toEqual(['b2', 'b1', 'b3']);
  });

  it('handles empty or null inputs gracefully', () => {
    expect(sortBadgesForDisplay([], new Set(), 'all', rarityOrder)).toEqual([]);
    expect(sortBadgesForDisplay(null, new Set(), 'all', rarityOrder)).toEqual([]);
    expect(sortBadgesForDisplay(badges, null, 'all', rarityOrder).length).toBe(3);
  });
});
