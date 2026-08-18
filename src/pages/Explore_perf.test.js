import { describe, it, expect } from 'vitest';

// Current implementation logic
function currentAllMinerals(hotspots) {
  const set = new Set();
  hotspots.forEach(h => (h.minerals || []).forEach(m => { if (m?.trim()) set.add(m.trim()); }));
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Optimized implementation logic
function optimizedAllMinerals(hotspots) {
  const set = new Set();
  for (let i = 0; i < hotspots.length; i++) {
    const mins = hotspots[i].minerals;
    if (!mins) continue;
    for (let j = 0; j < mins.length; j++) {
      const m = mins[j];
      if (m) {
        const trimmed = m.trim();
        if (trimmed) set.add(trimmed);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

describe('allMinerals optimization benchmark and correctness', () => {
  const sampleHotspots = [
    { id: 1, minerals: [' Quartz ', 'Amethyst', '   ', null, undefined] },
    { id: 2, minerals: ['Quartz', 'Agate', 'Jasper'] },
    { id: 3, minerals: null },
    { id: 4, minerals: ['Gold', ' Quartz ', 'Agate'] }
  ];

  it('should produce identical results', () => {
    const currentResult = currentAllMinerals(sampleHotspots);
    const optimizedResult = optimizedAllMinerals(sampleHotspots);
    expect(optimizedResult).toEqual(currentResult);
    expect(optimizedResult).toEqual(['Agate', 'Amethyst', 'Gold', 'Jasper', 'Quartz']);
  });

  it('benchmark execution performance', () => {
    // Generate large dataset
    const mineralsList = ['Quartz', 'Agate', 'Jasper', 'Gold', 'Silver', 'Copper', 'Pyrite', 'Fluorite', 'Beryl', 'Tourmaline'];
    const largeHotspots = [];
    for (let i = 0; i < 5000; i++) {
      if (i % 5 === 0) {
        largeHotspots.push({ id: i, minerals: null });
      } else {
        const mins = [];
        for (let j = 0; j < 10; j++) {
          mins.push(`  ${mineralsList[(i + j) % mineralsList.length]}  `);
        }
        largeHotspots.push({ id: i, minerals: mins });
      }
    }

    // Measure current implementation
    const startCurrent = performance.now();
    for (let k = 0; k < 100; k++) {
      currentAllMinerals(largeHotspots);
    }
    const durationCurrent = performance.now() - startCurrent;

    // Measure optimized implementation
    const startOptimized = performance.now();
    for (let k = 0; k < 100; k++) {
      optimizedAllMinerals(largeHotspots);
    }
    const durationOptimized = performance.now() - startOptimized;

    console.log(`Current duration: ${durationCurrent.toFixed(2)}ms`);
    console.log(`Optimized duration: ${durationOptimized.toFixed(2)}ms`);
    console.log(`Speedup: ${(durationCurrent / durationOptimized).toFixed(2)}x`);

    expect(durationOptimized).toBeLessThan(durationCurrent);
  });
});
