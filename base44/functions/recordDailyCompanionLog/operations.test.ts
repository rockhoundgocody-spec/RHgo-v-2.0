import { describe, expect, it, vi } from 'vitest';
import { collectPages, countByOwner, firstByOwner, writeLogsInBatches } from './operations.ts';

describe('daily companion log batching', () => {
  it('paginates all records instead of relying on a fixed cap', async () => {
    const fetchPage = vi.fn((limit: number, skip: number) => Promise.resolve(
      Array.from({ length: Math.min(limit, 5 - skip) }, (_, index) => ({ id: skip + index })),
    ));

    await expect(collectPages(fetchPage, 2)).resolves.toHaveLength(5);
    expect(fetchPage.mock.calls).toEqual([[2, 0], [2, 2], [2, 4]]);
  });

  it('counts specimens and retains the newest pre-sorted log per owner', () => {
    const specimens = [
      { created_by: 'a@example.test' },
      { created_by: 'a@example.test' },
      { created_by: 'b@example.test' },
    ];
    const newest = { owner_email: 'a@example.test', xp: 20 };

    expect(countByOwner(specimens, 'created_by')).toEqual(new Map([
      ['a@example.test', 2],
      ['b@example.test', 1],
    ]));
    expect(firstByOwner([newest, { owner_email: 'a@example.test', xp: 10 }], 'owner_email')
      .get('a@example.test')).toBe(newest);
  });

  it('bounds writes and reports create/update failures independently', async () => {
    let active = 0;
    let peak = 0;
    const perform = async (shouldFail = false) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      if (shouldFail) throw new Error('failed');
    };
    const update = vi.fn((_id: string) => perform(false));
    const create = vi.fn((payload: Record<string, unknown>) => perform(payload.fail === true));

    await expect(writeLogsInBatches([
      { id: 'existing', payload: { xp: 10 } },
      { payload: { xp: 20 } },
      { payload: { fail: true } },
      { payload: { xp: 40 } },
    ], update, create, 2)).resolves.toEqual({ written: 3, failed: 1 });
    expect(peak).toBe(2);
    expect(update).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledTimes(3);
  });
});
