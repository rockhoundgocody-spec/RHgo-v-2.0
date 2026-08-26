import { describe, expect, it, vi } from 'vitest';
import { deleteMineralsInBatches } from './operations.ts';

describe('deleteMineralsInBatches', () => {
  it('deletes each record once and reports partial failures', async () => {
    const remove = vi.fn(async (id: string) => {
      if (id === 'mineral-3') throw new Error('rate limited');
    });
    const minerals = Array.from({ length: 7 }, (_, index) => ({ id: `mineral-${index}` }));

    await expect(deleteMineralsInBatches(minerals, remove, 3)).resolves.toEqual({
      deleted: 6,
      failed: 1,
    });
    expect(remove).toHaveBeenCalledTimes(7);
  });

  it('never exceeds the requested concurrency', async () => {
    let active = 0;
    let peak = 0;
    const remove = vi.fn(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
    });
    const minerals = Array.from({ length: 9 }, (_, index) => ({ id: `mineral-${index}` }));

    await deleteMineralsInBatches(minerals, remove, 4);

    expect(peak).toBe(4);
  });

  it('clamps invalid concurrency to a safe sequential batch', async () => {
    const order: string[] = [];
    await deleteMineralsInBatches(
      [{ id: 'a' }, { id: 'b' }],
      async (id) => { order.push(id); },
      0,
    );

    expect(order).toEqual(['a', 'b']);
  });
});
