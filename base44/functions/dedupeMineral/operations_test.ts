import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { deleteMineralsInBatches } from './operations.ts';

Deno.test('deleteMineralsInBatches deletes each record and reports partial failures', async () => {
  const calls: string[] = [];
  const remove = (id: string) => {
    calls.push(id);
    return id === 'mineral-3'
      ? Promise.reject(new Error('rate limited'))
      : Promise.resolve();
  };
  const minerals = Array.from({ length: 7 }, (_, index) => ({ id: `mineral-${index}` }));

  assertEquals(await deleteMineralsInBatches(minerals, remove, 3), {
    deleted: 6,
    failed: 1,
  });
  assertEquals(calls.length, 7);
});

Deno.test('deleteMineralsInBatches respects requested concurrency', async () => {
  let active = 0;
  let peak = 0;
  const remove = async () => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active -= 1;
  };
  const minerals = Array.from({ length: 9 }, (_, index) => ({ id: `mineral-${index}` }));

  await deleteMineralsInBatches(minerals, remove, 4);

  assertEquals(peak, 4);
});

Deno.test('deleteMineralsInBatches clamps invalid concurrency', async () => {
  const order: string[] = [];
  await deleteMineralsInBatches(
    [{ id: 'a' }, { id: 'b' }],
    (id) => {
      order.push(id);
      return Promise.resolve();
    },
    0,
  );

  assertEquals(order, ['a', 'b']);
});
