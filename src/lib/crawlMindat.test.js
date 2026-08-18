import { describe, it, expect } from 'vitest';
import { fetchCandidatesInParallel } from '../../base44/functions/crawlMindat/fetchCandidatesInParallel.ts';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Sequential mock implementation for baseline measurement
async function fetchCandidatesSequential(base44, candidates, existingNames, fetchAndParseFn) {
  const created = [];
  const errors = [];
  for (const c of candidates) {
    if (existingNames.has(c.name.toLowerCase())) continue;
    try {
      const detail = await fetchAndParseFn(base44, c);
      if (!detail) { errors.push({ name: c.name, reason: 'parse_failed' }); continue; }
      created.push(detail);
      await sleep(100); // simulated network/politeness delay
    } catch (e) {
      errors.push({ name: c.name, reason: String(e.message || e) });
    }
  }
  return { created, errors };
}

describe('crawlMindat parallel optimization benchmark and correctness', () => {
  it('correctly fetches and parses candidates while ignoring existing ones', async () => {
    const mockCandidates = [
      { name: 'Quartz', url: 'https://mindat.org/min-1.html' },
      { name: 'Calcite', url: 'https://mindat.org/min-2.html' },
      { name: 'Gold', url: 'https://mindat.org/min-3.html' },
    ];
    const existingNames = new Set(['quartz']);

    const mockFetch = async (_base44, candidate) => {
      if (candidate.name === 'Gold') return null; // simulate parse failure
      return { name: candidate.name, formula: 'TestFormula' };
    };

    const res = await fetchCandidatesInParallel(null, mockCandidates, existingNames, mockFetch);

    expect(res.created).toEqual([
      { name: 'Calcite', formula: 'TestFormula' }
    ]);
    expect(res.errors).toEqual([
      { name: 'Gold', reason: 'parse_failed' }
    ]);
  });

  it('demonstrates measurable performance improvement over sequential processing', async () => {
    const itemCount = 5;
    const delayPerFetchMs = 50;
    const mockCandidates = Array.from({ length: itemCount }, (_, i) => ({
      name: `Mineral_${i}`,
      url: `https://mindat.org/min-${i}.html`,
    }));
    const existingNames = new Set();

    const mockFetch = async (_base44, candidate) => {
      await sleep(delayPerFetchMs);
      return { name: candidate.name };
    };

    // Baseline: Sequential execution
    const seqStart = Date.now();
    const seqRes = await fetchCandidatesSequential(null, mockCandidates, existingNames, mockFetch);
    const seqDuration = Date.now() - seqStart;

    // Optimized: Parallel execution with Promise.all
    const parStart = Date.now();
    const parRes = await fetchCandidatesInParallel(null, mockCandidates, existingNames, mockFetch);
    const parDuration = Date.now() - parStart;

    expect(parRes.created.length).toBe(itemCount);
    expect(seqRes.created.length).toBe(itemCount);

    console.log(`[Benchmark] Sequential execution for ${itemCount} items: ${seqDuration}ms`);
    console.log(`[Benchmark] Parallel execution for ${itemCount} items: ${parDuration}ms`);
    console.log(`[Benchmark] Speedup factor: ${(seqDuration / parDuration).toFixed(2)}x`);

    // Parallel execution should take roughly ~delayPerFetchMs (50ms) instead of ~itemCount * delayPerFetchMs (250ms)
    expect(parDuration).toBeLessThan(seqDuration * 0.5);
  });
});
