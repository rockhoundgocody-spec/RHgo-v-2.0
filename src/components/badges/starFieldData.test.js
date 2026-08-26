import { describe, expect, it } from 'vitest';
import { createStarField } from './starFieldData';

describe('createStarField', () => {
  it('creates stable graphics for the same badge instead of flickering on re-render', () => {
    expect(createStarField(60, 'quartz-master')).toEqual(createStarField(60, 'quartz-master'));
  });

  it('varies the field across badges while keeping values in visual bounds', () => {
    const quartz = createStarField(5, 'quartz');
    const agate = createStarField(5, 'agate');

    expect(quartz).not.toEqual(agate);
    expect(quartz).toHaveLength(5);
    for (const star of quartz) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThan(100);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThan(100);
      expect(star.size).toBeGreaterThanOrEqual(0.5);
      expect(star.size).toBeLessThanOrEqual(2);
      expect(star.opacity).toBeGreaterThanOrEqual(0.05);
      expect(star.opacity).toBeLessThanOrEqual(0.3);
    }
  });
});
