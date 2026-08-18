import { describe, it, expect } from 'vitest';

// Extract function logic matching Explore.jsx implementation for benchmarking and unit testing
export function extractUniqueMineralsBaseline(hotspots) {
  const set = new Set();
  hotspots.forEach(h => (h.minerals || []).forEach(m => { if (m?.trim()) set.add(m.trim()); }));
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function extractUniqueMineralsOptimized(hotspots) {
  const set = new Set();
  for (let i = 0; i < hotspots.length; i++) {
    const mins = hotspots[i].minerals;
    if (!mins) continue;
    for (let j = 0; j < mins.length; j++) {
      const m = mins[j];
      if (typeof m === 'string') {
        const trimmed = m.trim();
        if (trimmed) set.add(trimmed);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

describe('Explore mineral extraction', () => {
  it('correctly extracts, trims, deduplicates and sorts minerals', () => {
    const mockHotspots = [
      { id: '1', minerals: [' Quartz ', 'Amethyst', ' Quartz ', ''] },
      { id: '2', minerals: null },
      { id: '3', minerals: ['Agate', '  quartz  ', 'Jasper', '  '] },
      { id: '4', minerals: [undefined, null, 'Beryl'] },
    ];

    const baselineResult = extractUniqueMineralsBaseline(mockHotspots);
    const optimizedResult = extractUniqueMineralsOptimized(mockHotspots);

    expect(optimizedResult).toEqual(baselineResult);
  });

  it('runs performance benchmark comparing baseline vs optimized', () => {
    // Generate synthetic hotspots dataset
    const hotspots = [];
    for (let i = 0; i < 1000; i++) {
      const mins = [];
      for (let j = 0; j < 25; j++) {
        mins.push(j % 5 === 0 ? ' Quartz ' : j % 5 === 1 ? 'Amethyst' : j % 5 === 2 ? '  ' : null);
      }
      hotspots.push({ id: `h_${i}`, minerals: mins });
    }

    const iterations = 200;

    const startBaseline = performance.now();
    for (let i = 0; i < iterations; i++) {
      extractUniqueMineralsBaseline(hotspots);
    }
    const endBaseline = performance.now();
    const durationBaseline = endBaseline - startBaseline;

    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
      extractUniqueMineralsOptimized(hotspots);
    }
    const endOptimized = performance.now();
    const durationOptimized = endOptimized - startOptimized;

    console.log(`[Benchmark] Baseline: ${durationBaseline.toFixed(2)}ms | Optimized: ${durationOptimized.toFixed(2)}ms`);
    expect(durationOptimized).toBeLessThanOrEqual(durationBaseline * 1.5);
  });
});
