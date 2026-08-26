import { describe, it, expect, beforeAll } from 'vitest';

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

let computeRarityData, computeTopMinerals, computeWeeklyFinds, computeGeoStates, computeRarestFinds, computeSummaryStats, computeCollectionStats;

beforeAll(async () => {
  const mod = await import('./CollectionDashboard.jsx');
  computeRarityData = mod.computeRarityData;
  computeTopMinerals = mod.computeTopMinerals;
  computeWeeklyFinds = mod.computeWeeklyFinds;
  computeGeoStates = mod.computeGeoStates;
  computeRarestFinds = mod.computeRarestFinds;
  computeSummaryStats = mod.computeSummaryStats;
  computeCollectionStats = mod.computeCollectionStats;
});

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

  it('computes rarity breakdown accurately', () => {
    const rarity = computeRarityData(sampleSpecimens);
    expect(rarity).toEqual([
      { name: 'Common', value: 1, color: '#94a3b8', key: 'common' },
      { name: 'Uncommon', value: 1, color: '#34d399', key: 'uncommon' },
      { name: 'Rare', value: 1, color: '#38bdf8', key: 'rare' },
      { name: 'Legendary', value: 1, color: '#c084fc', key: 'legendary' },
    ]);
  });

  it('computes top minerals correctly sorted and truncated', () => {
    const top = computeTopMinerals(sampleSpecimens);
    expect(top).toEqual([
      { name: 'Quartz', count: 2 },
      { name: 'Diamond', count: 1 },
      { name: 'Emerald', count: 1 },
    ]);
  });

  it('computes weekly finds for 8 weeks', () => {
    const weekly = computeWeeklyFinds(sampleSpecimens);
    expect(weekly.length).toBe(8);
    const totalFinds = weekly.reduce((acc, w) => acc + w.count, 0);
    expect(totalFinds).toBe(4);
  });

  it('computes geo states properly', () => {
    const geo = computeGeoStates(sampleSpecimens);
    expect(geo).toEqual([
      ['Colorado', 2],
      ['Kimberley', 1],
      ['Muzo', 1],
    ]);
  });

  it('filters rarest finds to rare and legendary', () => {
    const rarest = computeRarestFinds(sampleSpecimens);
    expect(rarest.length).toBe(2);
    expect(rarest.map((s) => s.mineral_name)).toEqual(['Diamond', 'Emerald']);
  });

  it('computes summary statistics accurately', () => {
    const stats = computeSummaryStats(sampleSpecimens);
    expect(stats.verified).toBe(3);
    expect(stats.uniqueNames).toBe(3);
    expect(stats.rarePlus).toBe(2);
    expect(stats.avgConf).toBeCloseTo((0.95 + 0.85 + 0.99 + 0.9) / 4);
  });

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
