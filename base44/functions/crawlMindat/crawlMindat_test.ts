import { assertEquals, assert } from 'jsr:@std/assert@1';
import { bulkCreateInChunks } from './bulkCreateInChunks.ts';

Deno.test('bulkCreateInChunks: handles empty records without calling bulkCreate', async () => {
  let called = false;
  const mockEntity = {
    bulkCreate: (_chunk: unknown[]) => {
      called = true;
      return Promise.resolve();
    },
  };

  const count = await bulkCreateInChunks(mockEntity, []);
  assertEquals(count, 0);
  assertEquals(called, false);
});

Deno.test('bulkCreateInChunks: handles single chunk (< chunkSize) correctly', async () => {
  const createdChunks: unknown[][] = [];
  const mockEntity = {
    bulkCreate: (chunk: unknown[]) => {
      createdChunks.push(chunk);
      return Promise.resolve();
    },
  };

  const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Mineral ${i}` }));
  const count = await bulkCreateInChunks(mockEntity, items, 25);

  assertEquals(count, 10);
  assertEquals(createdChunks.length, 1);
  assertEquals(createdChunks[0].length, 10);
});

Deno.test('bulkCreateInChunks: parallelizes bulk creation across multiple chunks', async () => {
  const createdChunks: unknown[][] = [];
  const chunkSize = 25;
  const totalItems = 100; // 4 chunks
  const mockLatencyMs = 50;

  const items = Array.from({ length: totalItems }, (_, i) => ({ id: i, name: `Mineral ${i}` }));

  // Mock entity with artificial network latency
  const mockEntity = {
    bulkCreate: async (chunk: unknown[]) => {
      await new Promise((resolve) => setTimeout(resolve, mockLatencyMs));
      createdChunks.push(chunk);
    },
  };

  // Measure parallel bulk insertion
  const startTime = performance.now();
  const count = await bulkCreateInChunks(mockEntity, items, chunkSize);
  const elapsedTime = performance.now() - startTime;

  // Measure what sequential execution would take (4 chunks * 50ms = 200ms)
  const expectedSequentialTime = (totalItems / chunkSize) * mockLatencyMs;

  assertEquals(count, totalItems);
  assertEquals(createdChunks.length, 4);
  assertEquals(createdChunks.flat().length, totalItems);

  // Parallel execution should take ~50ms (+ overhead), well below sequential 200ms
  assert(
    elapsedTime < expectedSequentialTime * 0.7,
    `Parallel execution (${elapsedTime.toFixed(1)}ms) should be significantly faster than sequential baseline (${expectedSequentialTime}ms)`
  );
});
