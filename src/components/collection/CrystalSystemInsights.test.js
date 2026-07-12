import { vi, describe, it, expect } from 'vitest';

// Mock GlassPanel to avoid loading utilities that reference window or browser APIs
vi.mock('@/components/visuals/GlassPanel.jsx', () => ({
  default: () => null,
}));

vi.mock('@/lib/useEntityQuery.js', () => ({
  useEntityList: () => ({ data: [], isLoading: false }),
}));

// Mock recharts and other lucide-react icons if needed
vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

import { getCrystalSystemLookup } from './CrystalSystemInsights.jsx';

describe('getCrystalSystemLookup Caching and Performance', () => {
  it('should build the correct lookup map with lowercase, trimmed keys', () => {
    const minerals = [
      { name: '  Quartz ', crystal_system: 'Trigonal' },
      { name: 'Amethyst', crystal_system: 'Trigonal' },
      { name: 'Pyrite', crystal_system: 'Cubic' },
    ];

    const lookup = getCrystalSystemLookup(minerals);
    expect(lookup.get('quartz')).toBe('Trigonal');
    expect(lookup.get('amethyst')).toBe('Trigonal');
    expect(lookup.get('pyrite')).toBe('Cubic');
    expect(lookup.size).toBe(3);
  });

  it('should ignore minerals missing name or crystal_system', () => {
    const minerals = [
      { name: 'Quartz' },
      { crystal_system: 'Cubic' },
      { name: 'Pyrite', crystal_system: 'Cubic' },
    ];

    const lookup = getCrystalSystemLookup(minerals);
    expect(lookup.get('pyrite')).toBe('Cubic');
    expect(lookup.size).toBe(1);
  });

  it('should cache and return the exact same Map reference when called with the same minerals array', () => {
    const minerals = [
      { name: 'Quartz', crystal_system: 'Trigonal' },
    ];

    const lookup1 = getCrystalSystemLookup(minerals);
    const lookup2 = getCrystalSystemLookup(minerals);

    expect(lookup1).toBe(lookup2); // Referential equality check
  });

  it('should return a different Map reference when called with a new/different minerals array', () => {
    const minerals1 = [{ name: 'Quartz', crystal_system: 'Trigonal' }];
    const minerals2 = [{ name: 'Quartz', crystal_system: 'Trigonal' }];

    const lookup1 = getCrystalSystemLookup(minerals1);
    const lookup2 = getCrystalSystemLookup(minerals2);

    expect(lookup1).not.toBe(lookup2);
  });

  it('benchmark: caching should be significantly faster than rebuilding on repeated calls', () => {
    // Let's create a large array of minerals
    const minerals = Array.from({ length: 1000 }, (_, i) => ({
      name: `Mineral_${i}`,
      crystal_system: i % 2 === 0 ? 'Cubic' : 'Trigonal',
    }));

    // Baseline: rebuilding from scratch every time (what the old code did)
    const baselineStart = performance.now();
    for (let j = 0; j < 500; j++) {
      const lookup = new Map();
      for (const m of minerals) {
        if (m.name && m.crystal_system) {
          lookup.set(m.name.toLowerCase().trim(), m.crystal_system);
        }
      }
    }
    const baselineEnd = performance.now();
    const baselineDuration = baselineEnd - baselineStart;

    // Optimized: using getCrystalSystemLookup (returns cached reference after first build)
    const optStart = performance.now();
    for (let j = 0; j < 500; j++) {
      getCrystalSystemLookup(minerals);
    }
    const optEnd = performance.now();
    const optDuration = optEnd - optStart;

    console.log(`[Benchmark] Baseline (rebuilding from scratch 500x with 1000 items): ${baselineDuration.toFixed(2)}ms`);
    console.log(`[Benchmark] Optimized (using WeakMap cache 500x with 1000 items): ${optDuration.toFixed(2)}ms`);

    // The optimized version should be vastly faster (usually < 1ms vs ~50-100ms)
    expect(optDuration).toBeLessThan(baselineDuration);
  });
});
