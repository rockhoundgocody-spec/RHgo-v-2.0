import { describe, it, expect, vi } from 'vitest';

// Sequential deletion logic (original implementation)
async function deleteSequential(toDelete, deleteFn) {
  let deleted = 0;
  let failed = 0;
  for (const d of toDelete) {
    try {
      await deleteFn(d.id);
      deleted++;
    } catch {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return { deleted, failed };
}

// Batched concurrent deletion logic (optimized implementation)
async function deleteBatched(toDelete, deleteFn, batchSize = 10) {
  let deleted = 0;
  let failed = 0;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const chunk = toDelete.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      chunk.map((d) => deleteFn(d.id))
    );
    for (const res of results) {
      if (res.status === 'fulfilled') {
        deleted++;
      } else {
        failed++;
      }
    }
  }
  return { deleted, failed };
}

describe('dedupeMineral deletion logic', () => {
  it('correctly tracks deleted and failed counts in sequential mode', async () => {
    const items = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ];
    const mockDelete = vi.fn().mockImplementation((id) => {
      if (id === '2') return Promise.reject(new Error('Delete failed'));
      return Promise.resolve();
    });

    const result = await deleteSequential(items, mockDelete);
    expect(result.deleted).toBe(2);
    expect(result.failed).toBe(1);
    expect(mockDelete).toHaveBeenCalledTimes(3);
  });

  it('correctly tracks deleted and failed counts in batched mode', async () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: `id-${i}` }));
    const mockDelete = vi.fn().mockImplementation((id) => {
      if (id.endsWith('5')) return Promise.reject(new Error('Delete failed'));
      return Promise.resolve();
    });

    const result = await deleteBatched(items, mockDelete, 10);
    expect(result.deleted).toBe(23);
    expect(result.failed).toBe(2);
    expect(mockDelete).toHaveBeenCalledTimes(25);
  });

  it('measurably outperforms sequential deletion for a batch of items', async () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ id: `id-${i}` }));
    // Simulate network delay of 10ms
    const mockDelete = () => new Promise((r) => setTimeout(r, 10));

    const startSeq = Date.now();
    await deleteSequential(items, mockDelete);
    const durationSeq = Date.now() - startSeq;

    const startBatch = Date.now();
    await deleteBatched(items, mockDelete, 10);
    const durationBatch = Date.now() - startBatch;

    // Sequential: 12 items * (250ms sleep + 10ms delete) = ~3120ms
    // Batched: 2 batches of 10 items concurrently = ~20ms
    expect(durationBatch).toBeLessThan(durationSeq / 10);
  });
});
