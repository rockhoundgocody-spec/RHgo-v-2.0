import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { bulkCreateInParallel, chunkArray } from './operations.ts';

Deno.test('chunkArray splits items into chunks of specified size', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];
  assertEquals(chunkArray(items, 3), [
    [1, 2, 3],
    [4, 5, 6],
    [7],
  ]);
  assertEquals(chunkArray([], 25), []);
  assertEquals(chunkArray([1, 2], 0), [[1], [2]]);
});

Deno.test('bulkCreateInParallel inserts chunks in parallel and returns total written', async () => {
  const items = Array.from({ length: 75 }, (_, i) => ({ id: `m-${i}` }));
  const calls: string[][] = [];

  const bulkCreate = (chunk: { id: string }[]) => {
    calls.push(chunk.map((c) => c.id));
    return Promise.resolve();
  };

  const count = await bulkCreateInParallel(items, bulkCreate, 25);
  assertEquals(count, 75);
  assertEquals(calls.length, 3);
  assertEquals(calls[0].length, 25);
  assertEquals(calls[1].length, 25);
  assertEquals(calls[2].length, 25);
});

Deno.test('bulkCreateInParallel handles chunk failures gracefully', async () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ id: `m-${i}` }));

  const bulkCreate = (chunk: { id: string }[]) => {
    if (chunk[0].id === 'm-25') {
      return Promise.reject(new Error('Network glitch'));
    }
    return Promise.resolve();
  };

  const count = await bulkCreateInParallel(items, bulkCreate, 25);
  assertEquals(count, 25);
});

Deno.test('bulkCreateInParallel executes chunks concurrently', async () => {
  let active = 0;
  let peakActive = 0;

  const items = Array.from({ length: 100 }, (_, i) => ({ id: `m-${i}` }));
  const bulkCreate = async () => {
    active += 1;
    peakActive = Math.max(peakActive, active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    active -= 1;
  };

  await bulkCreateInParallel(items, bulkCreate, 25);
  assertEquals(peakActive, 4);
});
