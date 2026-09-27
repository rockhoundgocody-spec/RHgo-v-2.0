import { describe, it, expect } from 'vitest';
import { bulkCreateInParallel, chunkArray } from '../../base44/functions/crawlMindat/operations.ts';

describe('crawlMindat operations', () => {
  it('correctly chunks array into chunks of specified size', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ name: `Mineral ${i}` }));
    const chunks = chunkArray(items, 25);
    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toHaveLength(25);
    expect(chunks[3]).toHaveLength(25);
  });

  it('handles empty and edge case inputs', async () => {
    expect(chunkArray([], 25)).toEqual([]);
    expect(await bulkCreateInParallel([], async () => {}, 25)).toBe(0);
    expect(await bulkCreateInParallel(null, async () => {}, 25)).toBe(0);
  });

  it('demonstrates benchmark speedup over sequential chunk inserts', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ name: `Mineral ${i}` }));
    const mockChunkLatencyMs = 25;

    // Simulate sequential bulk insertion
    const startSeq = performance.now();
    let seqWritten = 0;
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      await new Promise((resolve) => setTimeout(resolve, mockChunkLatencyMs));
      seqWritten += chunk.length;
    }
    const durationSeq = performance.now() - startSeq;

    // Simulate parallel bulk insertion
    const startPar = performance.now();
    const parWritten = await bulkCreateInParallel(
      items,
      async () => {
        await new Promise((resolve) => setTimeout(resolve, mockChunkLatencyMs));
      },
      25,
    );
    const durationPar = performance.now() - startPar;

    expect(seqWritten).toBe(100);
    expect(parWritten).toBe(100);

    // Parallel should be significantly faster (~4x speedup: ~25ms vs ~100ms)
    expect(durationPar).toBeLessThan(durationSeq);
    const speedupMultiplier = durationSeq / durationPar;
    expect(speedupMultiplier).toBeGreaterThan(1.8);
  });
});
