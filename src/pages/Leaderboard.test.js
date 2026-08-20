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
});
