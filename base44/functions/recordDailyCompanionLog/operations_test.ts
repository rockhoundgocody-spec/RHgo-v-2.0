import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { collectPages, countByOwner, firstByOwner, writeLogsInBatches } from './operations.ts';

Deno.test('daily companion log batching paginates every record', async () => {
  const calls: number[][] = [];
  const fetchPage = (limit: number, skip: number) => {
    calls.push([limit, skip]);
    return Promise.resolve(
      Array.from({ length: Math.min(limit, 5 - skip) }, (_, index) => ({ id: skip + index })),
    );
  };

  assertEquals((await collectPages(fetchPage, 2)).length, 5);
  assertEquals(calls, [[2, 0], [2, 2], [2, 4]]);
});

Deno.test('daily companion log batching groups owner records', () => {
  const specimens = [
    { created_by: 'a@example.test' },
    { created_by: 'a@example.test' },
    { created_by: 'b@example.test' },
  ];
  const newest = { owner_email: 'a@example.test', xp: 20 };

  assertEquals(countByOwner(specimens, 'created_by'), new Map([
    ['a@example.test', 2],
    ['b@example.test', 1],
  ]));
  assertEquals(
    firstByOwner([newest, { owner_email: 'a@example.test', xp: 10 }], 'owner_email')
      .get('a@example.test'),
    newest,
  );
});

Deno.test('daily companion log batching bounds writes and reports failures', async () => {
  let active = 0;
  let peak = 0;
  let updateCalls = 0;
  let createCalls = 0;
  const perform = async (shouldFail = false) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active -= 1;
    if (shouldFail) throw new Error('failed');
  };
  const update = (_id: string) => {
    updateCalls += 1;
    return perform(false);
  };
  const create = (payload: Record<string, unknown>) => {
    createCalls += 1;
    return perform(payload.fail === true);
  };

  assertEquals(await writeLogsInBatches([
    { id: 'existing', payload: { xp: 10 } },
    { payload: { xp: 20 } },
    { payload: { fail: true } },
    { payload: { xp: 40 } },
  ], update, create, 2), { written: 3, failed: 1 });
  assertEquals(peak, 2);
  assertEquals(updateCalls, 1);
  assertEquals(createCalls, 3);
});
