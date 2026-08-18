import { describe, it, expect, vi } from 'vitest';

/**
 * Filter candidates helper to avoid listing all minerals.
 * Instead of fetching all minerals from the DB (`base44.asServiceRole.entities.Mineral.list()`),
 * fetch existing minerals by querying candidate names directly or in batches, or using `filter({ name: { $in: candidateNames } })`.
 */
export async function getExistingMineralNames(base44, candidates) {
  if (!candidates || candidates.length === 0) {
    return new Set();
  }

  const candidateNames = Array.from(new Set(candidates.map(c => c.name).filter(Boolean)));
  if (candidateNames.length === 0) {
    return new Set();
  }

  const existingNames = new Set();
  // Batch candidate names in chunks of 50 to avoid oversized query payloads
  const chunkSize = 50;
  for (let i = 0; i < candidateNames.length; i += chunkSize) {
    const chunk = candidateNames.slice(i, i + chunkSize);
    // Use $in filter with lower/case insensitive matching if needed, or exact candidate names
    const records = await base44.asServiceRole.entities.Mineral.filter({
      name: { $in: chunk }
    }, undefined, chunkSize, 0, ['name']);
    for (const r of records) {
      if (r.name) existingNames.add(r.name.toLowerCase());
    }
  }

  return existingNames;
}

describe('crawlMindat Optimization - getExistingMineralNames', () => {
  it('returns an empty set when candidates list is empty', async () => {
    const mockBase44 = {
      asServiceRole: {
        entities: {
          Mineral: {
            filter: vi.fn(),
            list: vi.fn(),
          }
        }
      }
    };

    const result = await getExistingMineralNames(mockBase44, []);
    expect(result.size).toBe(0);
    expect(mockBase44.asServiceRole.entities.Mineral.filter).not.toHaveBeenCalled();
    expect(mockBase44.asServiceRole.entities.Mineral.list).not.toHaveBeenCalled();
  });

  it('fetches only matching candidate names in batches via filter instead of listing all minerals', async () => {
    const filterSpy = vi.fn().mockImplementation(async (query) => {
      const namesInQuery = query.name.$in;
      return namesInQuery
        .filter(n => n.toLowerCase() === 'quartz' || n.toLowerCase() === 'gold')
        .map(n => ({ name: n }));
    });

    const mockBase44 = {
      asServiceRole: {
        entities: {
          Mineral: {
            filter: filterSpy,
            list: vi.fn(),
          }
        }
      }
    };

    const candidates = [
      { name: 'Quartz' },
      { name: 'Gold' },
      { name: 'Calcite' },
      { name: 'Diamond' }
    ];

    const existingSet = await getExistingMineralNames(mockBase44, candidates);

    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(filterSpy).toHaveBeenCalledWith(
      { name: { $in: ['Quartz', 'Gold', 'Calcite', 'Diamond'] } },
      undefined,
      50,
      0,
      ['name']
    );
    expect(mockBase44.asServiceRole.entities.Mineral.list).not.toHaveBeenCalled();

    expect(existingSet.has('quartz')).toBe(true);
    expect(existingSet.has('gold')).toBe(true);
    expect(existingSet.has('calcite')).toBe(false);
    expect(existingSet.has('diamond')).toBe(false);
  });

  it('handles batching when candidates exceed chunkSize', async () => {
    const filterSpy = vi.fn().mockResolvedValue([]);
    const mockBase44 = {
      asServiceRole: {
        entities: {
          Mineral: {
            filter: filterSpy,
          }
        }
      }
    };

    const candidates = Array.from({ length: 120 }, (_, i) => ({ name: `Mineral_${i}` }));
    await getExistingMineralNames(mockBase44, candidates);

    expect(filterSpy).toHaveBeenCalledTimes(3); // 50, 50, 20
  });
});

describe('Benchmark comparison: list() vs targeted filter()', () => {
  it('measures speed & payload savings comparing full list vs targeted batch filter', async () => {
    // Simulate DB with 10,000 mineral records
    const fullDatabase = Array.from({ length: 10000 }, (_, i) => ({
      id: `min_${i}`,
      name: `Mineral_${i}`,
      formula: 'SiO2',
      crystal_system: 'Hexagonal',
      hardness: '7',
      color: 'Colorless',
      luster: 'Vitreous',
      streak: 'White',
      description: 'A very common silicate mineral found in many rocks across earth crust...',
      category: 'Silicate',
      image_url: 'https://example.com/photo.jpg',
      created_date: new Date().toISOString()
    }));

    // Candidates slice for a crawl page (e.g. 50 items out of 10,000)
    const candidateSlice = Array.from({ length: 50 }, (_, i) => ({
      name: i % 2 === 0 ? `Mineral_${i}` : `NewMineral_${i}`
    }));

    // Baseline implementation: list()
    const mockBaselineBase44 = {
      asServiceRole: {
        entities: {
          Mineral: {
            list: async () => fullDatabase
          }
        }
      }
    };

    // Optimized implementation: filter()
    const mockOptimizedBase44 = {
      asServiceRole: {
        entities: {
          Mineral: {
            filter: async (query, sort, limit, skip, fields) => {
              const names = query.name.$in.map(n => n.toLowerCase());
              return fullDatabase
                .filter(m => names.includes(m.name.toLowerCase()))
                .map(m => {
                  if (fields && fields.length) {
                    const pick = {};
                    for (const f of fields) pick[f] = m[f];
                    return pick;
                  }
                  return m;
                });
            }
          }
        }
      }
    };

    // Run baseline 100 times to measure average execution time
    const startBaseline = performance.now();
    for (let i = 0; i < 100; i++) {
      const existing = await mockBaselineBase44.asServiceRole.entities.Mineral.list();
      const existingNames = new Set(existing.map(x => (x.name || '').toLowerCase()));
    }
    const baselineDuration = performance.now() - startBaseline;

    // Run optimized 100 times to measure average execution time
    const startOptimized = performance.now();
    for (let i = 0; i < 100; i++) {
      const existingNames = await getExistingMineralNames(mockOptimizedBase44, candidateSlice);
    }
    const optimizedDuration = performance.now() - startOptimized;

    console.log(`Baseline 100 runs duration: ${baselineDuration.toFixed(2)}ms`);
    console.log(`Optimized 100 runs duration: ${optimizedDuration.toFixed(2)}ms`);

    expect(optimizedDuration).toBeLessThan(baselineDuration);
  });
});
