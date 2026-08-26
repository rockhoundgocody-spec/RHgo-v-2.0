import { describe, expect, it, vi } from 'vitest';
import { chunkValues, collectPages, groupDigestRecords } from './operations.ts';

describe('weekly summary batching', () => {
  it('bounds email filters without dropping users', () => {
    expect(chunkValues(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ]);
  });

  it('paginates until the backend returns a partial page', async () => {
    const fetchPage = vi.fn(async (limit: number, skip: number) =>
      Array.from({ length: Math.min(limit, 5 - skip) }, (_, index) => skip + index),
    );

    await expect(collectPages(fetchPage, 2)).resolves.toEqual([0, 1, 2, 3, 4]);
    expect(fetchPage.mock.calls).toEqual([[2, 0], [2, 2], [2, 4]]);
  });

  it('groups recent specimens and keeps the newest companion per owner', () => {
    const newest = { owner_email: 'a@example.test', id: 'new' };
    const grouped = groupDigestRecords(
      [
        { created_by: 'a@example.test', id: 's1' },
        { created_by: 'a@example.test', id: 's2' },
        { created_by: 'b@example.test', id: 's3' },
      ],
      [newest, { owner_email: 'a@example.test', id: 'old' }],
    );

    expect(grouped.specimensByEmail.get('a@example.test')).toHaveLength(2);
    expect(grouped.specimensByEmail.get('b@example.test')).toHaveLength(1);
    expect(grouped.companionByEmail.get('a@example.test')).toBe(newest);
  });
});
