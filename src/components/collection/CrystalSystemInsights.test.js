import { describe, it, expect, beforeAll } from 'vitest';

describe('computeCrystalSystemData', () => {
  let computeCrystalSystemData;

  beforeAll(async () => {
    if (typeof window === 'undefined') {
      globalThis.window = {
        self: {},
        top: {},
        location: { pathname: '/', search: '', hash: '' },
        history: { replaceState: () => {} },
        addEventListener: () => {},
        removeEventListener: () => {},
        localStorage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      };
      globalThis.document = {
        title: 'RockHound-GO',
        referrer: '',
      };
    }
    const mod = await import('./CrystalSystemInsights.jsx');
    computeCrystalSystemData = mod.computeCrystalSystemData;
  });

  it('returns empty array when specimens is undefined or empty', () => {
    expect(computeCrystalSystemData(undefined)).toEqual([]);
    expect(computeCrystalSystemData(null)).toEqual([]);
    expect(computeCrystalSystemData([])).toEqual([]);
  });

  it('correctly maps mineral names using database lookup (case-insensitive and trimmed)', () => {
    const minerals = [
      { name: ' Quartz ', crystal_system: 'Trigonal' },
      { name: 'Beryl', crystal_system: 'Hexagonal' },
    ];
    const specimens = [
      { mineral_name: 'quartz' },
      { mineral_name: ' QUARTZ ' },
      { mineral_name: 'beryl' },
    ];

    const result = computeCrystalSystemData(specimens, minerals);
    expect(result).toEqual([
      { system: 'Trigonal', count: 2 },
      { system: 'Hexagonal', count: 1 },
    ]);
  });

  it('uses static FALLBACKS when mineral is not in database', () => {
    const specimens = [
      { mineral_name: 'Agate' },
      { mineral_name: 'diamond' },
    ];

    const result = computeCrystalSystemData(specimens, []);
    expect(result).toEqual([
      { system: 'Trigonal (Quartz Family)', count: 1 },
      { system: 'Cubic', count: 1 },
    ]);
  });

  it('classifies unmapped mineral names as Unknown', () => {
    const specimens = [
      { mineral_name: 'Kryptonite' },
      { mineral_name: ' Unobtanium ' },
      { mineral_name: null },
    ];

    const result = computeCrystalSystemData(specimens, []);
    expect(result).toEqual([
      { system: 'Unknown', count: 3 },
    ]);
  });

  it('sorts aggregated crystal systems in descending order by count', () => {
    const specimens = [
      { mineral_name: 'diamond' },
      { mineral_name: 'pyrite' },
      { mineral_name: 'galena' },
      { mineral_name: 'opal' },
    ];

    const result = computeCrystalSystemData(specimens, []);
    expect(result).toEqual([
      { system: 'Cubic', count: 3 },
      { system: 'Amorphous', count: 1 },
    ]);
  });
});
