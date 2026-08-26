import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { chunkValues, collectPages, groupDigestRecords } from './operations.ts';

Deno.test('weekly summary batching bounds email filters', () => {
  assertEquals(chunkValues(['a', 'b', 'c', 'd', 'e'], 2), [
    ['a', 'b'],
    ['c', 'd'],
    ['e'],
  ]);
});

Deno.test('weekly summary batching paginates until a partial page', async () => {
  const calls: number[][] = [];
  const fetchPage = (limit: number, skip: number) => {
    calls.push([limit, skip]);
    return Promise.resolve(
      Array.from({ length: Math.min(limit, 5 - skip) }, (_, index) => skip + index),
    );
  };

  assertEquals(await collectPages(fetchPage, 2), [0, 1, 2, 3, 4]);
  assertEquals(calls, [[2, 0], [2, 2], [2, 4]]);
});

Deno.test('weekly summary batching groups records by owner', () => {
  const newest = { owner_email: 'a@example.test', id: 'new' };
  const grouped = groupDigestRecords(
    [
      { created_by: 'a@example.test', id: 's1' },
      { created_by: 'a@example.test', id: 's2' },
      { created_by: 'b@example.test', id: 's3' },
    ],
    [newest, { owner_email: 'a@example.test', id: 'old' }],
  );

  assertEquals(grouped.specimensByEmail.get('a@example.test')?.length, 2);
  assertEquals(grouped.specimensByEmail.get('b@example.test')?.length, 1);
  assertEquals(grouped.companionByEmail.get('a@example.test'), newest);
});
