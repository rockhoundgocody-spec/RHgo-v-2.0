import { describe, it, expect } from 'vitest';
import { computeGridStats } from './Collection.jsx';

describe('computeGridStats', () => {
  it('returns zeroes for empty specimens array or undefined', () => {
    expect(computeGridStats([])).toEqual({ total: 0, unique: 0, rarePlus: 0 });
    expect(computeGridStats(undefined)).toEqual({ total: 0, unique: 0, rarePlus: 0 });
  });

  it('computes total, unique mineral count, and rare+ count correctly', () => {
    const specimens = [
      { id: '1', mineral_name: 'Quartz', rarity: 'common' },
      { id: '2', mineral_name: 'Quartz', rarity: 'uncommon' },
      { id: '3', mineral_name: 'Diamond', rarity: 'legendary' },
      { id: '4', mineral_name: 'Emerald', rarity: 'rare' },
      { id: '5', mineral_name: 'Calcite', rarity: 'common' },
    ];

    const stats = computeGridStats(specimens);
    expect(stats.total).toBe(5);
    expect(stats.unique).toBe(4); // Quartz, Diamond, Emerald, Calcite
    expect(stats.rarePlus).toBe(2); // Diamond (legendary), Emerald (rare)
  });

  it('handles nullish specimens and preserves unique count behavior', () => {
    const specimens = [
      { id: '1', mineral_name: 'Pyrite', rarity: 'common' },
      null,
      undefined,
      { id: '2', mineral_name: 'Pyrite', rarity: 'rare' },
      { id: '3', mineral_name: undefined, rarity: 'legendary' },
    ];

    const stats = computeGridStats(specimens);
    expect(stats.total).toBe(5);
    // Set contains 'Pyrite' and undefined (same behavior as new Set(specimens.map(s => s.mineral_name)).size)
    expect(stats.unique).toBe(2);
    expect(stats.rarePlus).toBe(2);
  });
});
