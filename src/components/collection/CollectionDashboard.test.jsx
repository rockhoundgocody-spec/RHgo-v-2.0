import { describe, it, expect } from 'vitest';

// Helper function implementing the original logic under test
function computeStatsOriginal(specimens) {
  const verified = specimens.filter((s) => s.verified).length;
  const uniqueNames = new Set(specimens.map((s) => s.mineral_name)).size;
  const rarePlus = specimens.filter((s) => s.rarity === 'rare' || s.rarity === 'legendary').length;
  const avgConf = specimens.filter((s) => s.ai_confidence)
    .reduce((a, s, _, arr) => a + s.ai_confidence / arr.length, 0);

  return { verified, uniqueNames, rarePlus, avgConf };
}

function computeStatsSinglePass(specimens) {
  let verified = 0;
  let rarePlus = 0;
  let aiConfSum = 0;
  let aiConfCount = 0;
  const uniqueNamesSet = new Set();

  for (let i = 0; i < specimens.length; i++) {
    const s = specimens[i];
    if (s.verified) verified++;
    if (s.mineral_name) uniqueNamesSet.add(s.mineral_name);
    if (s.rarity === 'rare' || s.rarity === 'legendary') rarePlus++;
    if (s.ai_confidence) {
      aiConfSum += s.ai_confidence;
      aiConfCount++;
    }
  }

  const uniqueNames = uniqueNamesSet.size;
  const avgConf = aiConfCount > 0 ? aiConfSum / aiConfCount : 0;

  return { verified, uniqueNames, rarePlus, avgConf };
}

describe('CollectionDashboard Stats Calculation', () => {
  it('calculates correct statistics on empty specimens array', () => {
    const specimens = [];
    const orig = computeStatsOriginal(specimens);
    const opt = computeStatsSinglePass(specimens);

    expect(orig).toEqual({ verified: 0, uniqueNames: 0, rarePlus: 0, avgConf: 0 });
    expect(opt).toEqual(orig);
  });

  it('calculates correct statistics on sample specimens', () => {
    const specimens = [
      { id: '1', mineral_name: 'Quartz', verified: true, rarity: 'common', ai_confidence: 0.9 },
      { id: '2', mineral_name: 'Quartz', verified: false, rarity: 'rare', ai_confidence: 0.8 },
      { id: '3', mineral_name: 'Amethyst', verified: true, rarity: 'legendary', ai_confidence: null },
      { id: '4', mineral_name: 'Pyrite', verified: false, rarity: 'uncommon', ai_confidence: 0.7 },
    ];

    const orig = computeStatsOriginal(specimens);
    const opt = computeStatsSinglePass(specimens);

    expect(orig.verified).toBe(2);
    expect(orig.uniqueNames).toBe(3);
    expect(orig.rarePlus).toBe(2);
    expect(orig.avgConf).toBeCloseTo(0.8, 5);

    expect(opt.verified).toBe(orig.verified);
    expect(opt.uniqueNames).toBe(orig.uniqueNames);
    expect(opt.rarePlus).toBe(orig.rarePlus);
    expect(opt.avgConf).toBeCloseTo(orig.avgConf, 5);
  });

  it('benchmark comparison on 100,000 specimens', () => {
    // Generate 100,000 specimens
    const rarities = ['common', 'uncommon', 'rare', 'legendary'];
    const minerals = ['Quartz', 'Amethyst', 'Pyrite', 'Galena', 'Calcite', 'Beryl', 'Topaz', 'Fluorite'];
    const specimens = Array.from({ length: 100000 }, (_, i) => ({
      id: String(i),
      mineral_name: minerals[i % minerals.length],
      verified: i % 2 === 0,
      rarity: rarities[i % rarities.length],
      ai_confidence: i % 3 === 0 ? 0.75 + (i % 20) * 0.01 : 0,
    }));

    // Warmup
    computeStatsOriginal(specimens);
    computeStatsSinglePass(specimens);

    const iterations = 50;

    const startOrig = performance.now();
    for (let i = 0; i < iterations; i++) {
      computeStatsOriginal(specimens);
    }
    const endOrig = performance.now();
    const durationOrig = endOrig - startOrig;

    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      computeStatsSinglePass(specimens);
    }
    const endOpt = performance.now();
    const durationOpt = endOpt - startOpt;

    console.log(`Original duration (${iterations} iterations): ${durationOrig.toFixed(2)} ms`);
    console.log(`Single-pass duration (${iterations} iterations): ${durationOpt.toFixed(2)} ms`);
    console.log(`Speedup: ${(durationOrig / durationOpt).toFixed(2)}x`);

    const resOpt = computeStatsSinglePass(specimens);
    const resOrig = computeStatsOriginal(specimens);

    expect(resOpt.verified).toBe(resOrig.verified);
    expect(resOpt.uniqueNames).toBe(resOrig.uniqueNames);
    expect(resOpt.rarePlus).toBe(resOrig.rarePlus);
    expect(resOpt.avgConf).toBeCloseTo(resOrig.avgConf, 5);
  });
});
