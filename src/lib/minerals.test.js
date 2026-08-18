import { describe, it, expect } from 'vitest';
import { getAllMinerals, getAllMineralsBaseline } from './minerals.js';

describe('getAllMinerals', () => {
  it('extracts unique, trimmed minerals and returns them sorted', () => {
    const hotspots = [
      { minerals: [' Quartz ', 'Amethyst', 'quartz'] },
      { minerals: ['Agate', ' Quartz', '  '] },
      { minerals: null },
      { minerals: ['Jasper', 'Amethyst '] },
    ];

    const result = getAllMinerals(hotspots);
    expect(result).toEqual(getAllMineralsBaseline(hotspots));
  });

  it('handles empty hotspots or missing minerals arrays gracefully', () => {
    expect(getAllMinerals([])).toEqual([]);
    expect(getAllMinerals([{ minerals: null }, {}])).toEqual([]);
    expect(getAllMinerals([])).toEqual(getAllMineralsBaseline([]));
  });

  it('handles null and undefined minerals in array', () => {
    const hotspots = [
      { minerals: ['Quartz', null, undefined, '', '   ', 'Beryl'] }
    ];
    expect(getAllMinerals(hotspots)).toEqual(['Beryl', 'Quartz']);
    expect(getAllMinerals(hotspots)).toEqual(getAllMineralsBaseline(hotspots));
  });

  it('benchmark test comparing baseline vs optimized', () => {
    const mineralsList = [' Quartz ', 'Amethyst ', ' Agate', 'Jasper', 'Beryl', ' Topaz', 'Garnet ', 'Opal', ' Ruby', 'Sapphire'];
    const hotspots = Array.from({ length: 5000 }, (_, i) => ({
      id: `h-${i}`,
      minerals: [
        mineralsList[i % mineralsList.length],
        mineralsList[(i + 3) % mineralsList.length],
        mineralsList[(i + 7) % mineralsList.length],
        '   ',
        null,
      ],
    }));

    const iterations = 200;

    // Baseline benchmark
    const startBaseline = performance.now();
    for (let i = 0; i < iterations; i++) {
      getAllMineralsBaseline(hotspots);
    }
    const endBaseline = performance.now();
    const baselineAvg = (endBaseline - startBaseline) / iterations;

    // Optimized benchmark
    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      getAllMinerals(hotspots);
    }
    const endOpt = performance.now();
    const optAvg = (endOpt - startOpt) / iterations;

    console.log(`[Benchmark] Baseline avg time: ${baselineAvg.toFixed(4)} ms`);
    console.log(`[Benchmark] Optimized avg time: ${optAvg.toFixed(4)} ms`);
    console.log(`[Benchmark] Speedup: ${(baselineAvg / optAvg).toFixed(2)}x`);

    expect(optAvg).toBeGreaterThan(0);
  });
});
