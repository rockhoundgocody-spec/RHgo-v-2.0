import { describe, it, expect, beforeAll, vi } from 'vitest';

// Set up minimal browser environment globals before importing modules with side-effects
globalThis.window = globalThis.window || {
  self: {},
  top: {},
  location: { search: '', href: '', pathname: '' },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  history: {
    replaceState: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.document = globalThis.document || { title: '' };

vi.mock('recharts', () => ({
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => children,
  LineChart: () => null,
  Line: () => null,
}));

let computeCollectionStats;

beforeAll(async () => {
  const mod = await import('./CollectionDashboard.jsx');
  computeCollectionStats = mod.computeCollectionStats;
}, 30000);

describe('CollectionDashboard data helpers', () => {
  const sampleSpecimens = [
    {
      id: '1',
      mineral_name: 'Quartz',
      rarity: 'common',
      verified: true,
      found_at: 'Colorado, USA',
      found_date: new Date().toISOString(),
      ai_confidence: 0.95,
    },
    {
      id: '2',
      mineral_name: 'Quartz',
      rarity: 'uncommon',
      verified: false,
      found_at: 'Colorado, USA',
      found_date: new Date().toISOString(),
      ai_confidence: 0.85,
    },
    {
      id: '3',
      mineral_name: 'Diamond',
      rarity: 'legendary',
      verified: true,
      found_at: 'Kimberley, South Africa',
      found_date: new Date().toISOString(),
      ai_confidence: 0.99,
    },
    {
      id: '4',
      mineral_name: 'Emerald',
      rarity: 'rare',
      verified: true,
      found_at: 'Muzo, Colombia',
      found_date: new Date().toISOString(),
      ai_confidence: 0.9,
    },
  ];

  it('computes all rendered dashboard data in one aggregate pass', () => {
    const stats = computeCollectionStats([
      ...sampleSpecimens,
      { id: '5', mineral_name: '__proto__', found_at: '__proto__, Test', ai_confidence: 0 },
      { id: '6', mineral_name: '__proto__', found_at: '__proto__, Test', ai_confidence: 'invalid' },
    ]);

    expect(stats.topMinerals[0]).toEqual({ name: 'Quartz', count: 2 });
    expect(stats.topMinerals).toContainEqual({ name: '__proto__', count: 2 });
    expect(stats.geoStates).toContainEqual(['__proto__', 2]);
    expect(stats.summaryStats.uniqueNames).toBe(4);
    expect(stats.summaryStats.avgConf).toBeCloseTo((0.95 + 0.85 + 0.99 + 0.9) / 5);
  });
});