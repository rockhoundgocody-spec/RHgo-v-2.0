import { describe, expect, it } from 'vitest';
import { createHeatDots } from './HeatMapBanner.jsx';

describe('createHeatDots', () => {
  it('creates a stable fallback visualization inside the banner bounds', () => {
    const first = createHeatDots([], 400);
    const second = createHeatDots([], 400);

    expect(first).toEqual(second);
    expect(first).toHaveLength(12);
    expect(first.every((dot) => dot.x >= 0 && dot.x <= 400)).toBe(true);
    expect(first.every((dot) => dot.y >= 0 && dot.y <= 56)).toBe(true);
  });

  it('uses stable listing identities and rarity colors', () => {
    const listings = [
      { id: 'quartz-1', mineral_name: 'Quartz', rarity: 'rare' },
      { id: 'agate-1', mineral_name: 'Agate', rarity: 'uncommon' },
    ];

    const dots = createHeatDots(listings, 320);

    expect(dots).toEqual(createHeatDots(listings, 320));
    expect(dots).toHaveLength(2);
    expect(dots.map((dot) => dot.color)).toEqual(['#38bdf8', '#34d399']);
    expect(dots.every((dot) => dot.x >= 0 && dot.x <= 320)).toBe(true);
  });

  it('falls back to the common color for unknown rarity values', () => {
    expect(createHeatDots([{ id: 'mystery', rarity: 'unknown' }], 200)[0].color).toBe('#94a3b8');
  });
});
