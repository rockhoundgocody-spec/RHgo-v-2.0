import { vi, describe, it, expect, beforeAll } from 'vitest';

// Top-level mock
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: 'user@example.com' }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { rows: [] } }),
    },
  },
}));

let computeSortedRanks;
let filterRows;

beforeAll(async () => {
  // Define full window mock before dynamic import executes module evaluation
  globalThis.window = {
    self: {},
    top: {},
    location: {
      search: '',
      href: 'http://localhost:3000',
      pathname: '/',
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;

  const mod = await import('./Leaderboard.jsx');
  computeSortedRanks = mod.computeSortedRanks;
  filterRows = mod.filterRows;
});

describe('Leaderboard helper functions', () => {
  const mockRows = [
    { name: 'Alice', unique_minerals: 10, total_weight_lbs: 25, email: 'alice@example.com' },
    { name: 'Bob', unique_minerals: 15, total_weight_lbs: 10, email: 'bob@example.com' },
    { name: 'Charlie', unique_minerals: 5, total_weight_lbs: 50, email: 'charlie@example.com' },
  ];

  describe('computeSortedRanks', () => {
    it('correctly ranks collectors by unique minerals', () => {
      const sorted = computeSortedRanks(mockRows, 'unique_minerals');
      expect(sorted).toHaveLength(3);
      expect(sorted[0].name).toBe('Bob');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].name).toBe('Alice');
      expect(sorted[1].rank).toBe(2);
      expect(sorted[2].name).toBe('Charlie');
      expect(sorted[2].rank).toBe(3);
    });

    it('correctly ranks collectors by total weight', () => {
      const sorted = computeSortedRanks(mockRows, 'total_weight_lbs');
      expect(sorted).toHaveLength(3);
      expect(sorted[0].name).toBe('Charlie');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].name).toBe('Alice');
      expect(sorted[1].rank).toBe(2);
      expect(sorted[2].name).toBe('Bob');
      expect(sorted[2].rank).toBe(3);
    });

    it('uses unique_minerals as a secondary tie-breaker when primary sort keys are equal', () => {
      const tieRows = [
        { name: 'Dave', total_weight_lbs: 30, unique_minerals: 12 },
        { name: 'Eve', total_weight_lbs: 30, unique_minerals: 20 },
        { name: 'Frank', total_weight_lbs: 30, unique_minerals: 5 },
      ];
      const sorted = computeSortedRanks(tieRows, 'total_weight_lbs');
      expect(sorted[0].name).toBe('Eve');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].name).toBe('Dave');
      expect(sorted[1].rank).toBe(2);
      expect(sorted[2].name).toBe('Frank');
      expect(sorted[2].rank).toBe(3);
    });

    it('does not mutate the original rows array', () => {
      const copy = JSON.parse(JSON.stringify(mockRows));
      const sorted = computeSortedRanks(mockRows, 'unique_minerals');
      expect(mockRows).toEqual(copy);
      expect(sorted).not.toBe(mockRows);
    });

    it('handles empty rows array', () => {
      const sorted = computeSortedRanks([], 'unique_minerals');
      expect(sorted).toEqual([]);
    });

    it('handles single element rows array', () => {
      const singleRow = [{ name: 'Single', unique_minerals: 7, total_weight_lbs: 12 }];
      const sorted = computeSortedRanks(singleRow, 'unique_minerals');
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toEqual({
        name: 'Single',
        unique_minerals: 7,
        total_weight_lbs: 12,
        rank: 1,
      });
    });
  });

  describe('filterRows', () => {
    it('filters rows by search term case-insensitively', () => {
      const sorted = computeSortedRanks(mockRows, 'unique_minerals');
      const filteredBob = filterRows(sorted, 'BOB');
      expect(filteredBob).toHaveLength(1);
      expect(filteredBob[0].name).toBe('Bob');
      expect(filteredBob[0].rank).toBe(1);

      const filteredEmpty = filterRows(sorted, '   ');
      expect(filteredEmpty).toHaveLength(3);

      const filteredNone = filterRows(sorted, 'Nonexistent');
      expect(filteredNone).toHaveLength(0);
    });

    it('handles rows with missing, null, or undefined name properties without error', () => {
      const edgeRows = [
        { name: null, unique_minerals: 5, rank: 1 },
        { name: undefined, unique_minerals: 4, rank: 2 },
        { name: 'Grace', unique_minerals: 3, rank: 3 },
      ];
      const result = filterRows(edgeRows, 'grace');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Grace');

      const allResultsForBlankQuery = filterRows(edgeRows, '  ');
      expect(allResultsForBlankQuery).toHaveLength(3);
    });

    it('trims search query whitespace and matches partial substrings', () => {
      const sorted = computeSortedRanks(mockRows, 'unique_minerals');
      const partialMatch = filterRows(sorted, '  lic  ');
      expect(partialMatch).toHaveLength(1);
      expect(partialMatch[0].name).toBe('Alice');
    });

    it('preserves pre-calculated rank on filtered items', () => {
      const sorted = computeSortedRanks(mockRows, 'unique_minerals');
      // Bob is rank 1, Alice is rank 2, Charlie is rank 3
      const filteredCharlie = filterRows(sorted, 'Charlie');
      expect(filteredCharlie).toHaveLength(1);
      expect(filteredCharlie[0].name).toBe('Charlie');
      expect(filteredCharlie[0].rank).toBe(3);
    });
  });
});
