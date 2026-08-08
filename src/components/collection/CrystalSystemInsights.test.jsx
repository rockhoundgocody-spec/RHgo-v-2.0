import { vi, describe, it, expect } from 'vitest';

// Mock recharts and other modules to avoid Node runtime or ESM issues with DOM elements
vi.mock('recharts', () => ({
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ResponsiveContainer: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

vi.mock('../../components/visuals/GlassPanel.jsx', () => ({
  default: () => null,
}));

vi.mock('../../lib/useEntityQuery', () => ({
  useEntityList: () => ({ data: [], isLoading: false }),
}));

import { getMineralLookup, mineralLookupCache } from './CrystalSystemInsights.jsx';

describe('CrystalSystemInsights mineral lookup cache', () => {
  it('should return an empty map when minerals list is null, undefined, or empty', () => {
    const map1 = getMineralLookup(null);
    expect(map1).toBeInstanceOf(Map);
    expect(map1.size).toBe(0);

    const map2 = getMineralLookup(undefined);
    expect(map2).toBeInstanceOf(Map);
    expect(map2.size).toBe(0);

    const map3 = getMineralLookup([]);
    expect(map3).toBeInstanceOf(Map);
    expect(map3.size).toBe(0);
  });

  it('should correctly build lookup map from minerals array', () => {
    const minerals = [
      { name: 'Quartz', crystal_system: 'Trigonal' },
      { name: 'Pyrite', crystal_system: 'Cubic' },
      { name: '  Amethyst  ', crystal_system: 'Trigonal' }, // test whitespace trimming
    ];

    const map = getMineralLookup(minerals);
    expect(map.size).toBe(3);
    expect(map.get('quartz')).toBe('Trigonal');
    expect(map.get('pyrite')).toBe('Cubic');
    expect(map.get('amethyst')).toBe('Trigonal');
  });

  it('should cache and return the exact same Map instance for referentially stable minerals array', () => {
    const minerals = [
      { name: 'Garnet', crystal_system: 'Cubic' },
    ];

    const mapA = getMineralLookup(minerals);
    const mapB = getMineralLookup(minerals);

    // Assert that the references are identical (cache hit)
    expect(mapA).toBe(mapB);
    expect(mineralLookupCache.has(minerals)).toBe(true);
  });

  it('should compute a new Map for a different minerals array reference', () => {
    const minerals1 = [{ name: 'Garnet', crystal_system: 'Cubic' }];
    const minerals2 = [{ name: 'Garnet', crystal_system: 'Cubic' }];

    const map1 = getMineralLookup(minerals1);
    const map2 = getMineralLookup(minerals2);

    expect(map1).not.toBe(map2);
  });
});
