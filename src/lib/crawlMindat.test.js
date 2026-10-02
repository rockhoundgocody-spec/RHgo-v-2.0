import { describe, it, expect, vi } from 'vitest';
import { bulkCreateInChunks } from '../../base44/functions/crawlMindat/bulkCreateInChunks.ts';

describe('bulkCreateInChunks', () => {
  it('handles empty records without calling bulkCreate', async () => {
    const mockBulkCreate = vi.fn().mockResolvedValue(undefined);
    const mockEntity = { bulkCreate: mockBulkCreate };

    const count = await bulkCreateInChunks(mockEntity, []);
    expect(count).toBe(0);
    expect(mockBulkCreate).not.toHaveBeenCalled();
  });

  it('handles single chunk (< chunkSize) correctly', async () => {
    const mockBulkCreate = vi.fn().mockResolvedValue(undefined);
    const mockEntity = { bulkCreate: mockBulkCreate };

    const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Mineral ${i}` }));
    const count = await bulkCreateInChunks(mockEntity, items, 25);

    expect(count).toBe(10);
    expect(mockBulkCreate).toHaveBeenCalledTimes(1);
    expect(mockBulkCreate).toHaveBeenCalledWith(items);
  });

  it('parallelizes bulk creation across multiple chunks and achieves performance gain', async () => {
    const createdChunks = [];
    const chunkSize = 25;
    const totalItems = 100; // 4 chunks
    const mockLatencyMs = 50;

    const items = Array.from({ length: totalItems }, (_, i) => ({ id: i, name: `Mineral ${i}` }));

    const mockEntity = {
      bulkCreate: vi.fn().mockImplementation(async (chunk) => {
        await new Promise((resolve) => setTimeout(resolve, mockLatencyMs));
        createdChunks.push(chunk);
      }),
    };

    const startTime = performance.now();
    const count = await bulkCreateInChunks(mockEntity, items, chunkSize);
    const elapsedTime = performance.now() - startTime;

    const expectedSequentialTime = (totalItems / chunkSize) * mockLatencyMs;

    expect(count).toBe(totalItems);
    expect(mockEntity.bulkCreate).toHaveBeenCalledTimes(4);
    expect(createdChunks.flat()).toHaveLength(totalItems);

    // Parallel execution (~50ms) should be significantly faster than sequential baseline (200ms)
    expect(elapsedTime).toBeLessThan(expectedSequentialTime * 0.7);
  });
});
