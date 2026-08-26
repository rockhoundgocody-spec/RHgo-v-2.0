import { describe, expect, it } from 'vitest';
import { getTileMotion } from './galleryMotion';

describe('getTileMotion', () => {
  it('caps stagger delay so large galleries become interactive promptly', () => {
    expect(getTileMotion(12, false).transition.delay).toBe(0.3);
    expect(getTileMotion(500, false).transition.delay).toBe(0.3);
  });

  it('disables movement and delay for reduced-motion users', () => {
    expect(getTileMotion(5, true)).toEqual({
      initial: false,
      transition: { duration: 0 },
    });
  });
});
