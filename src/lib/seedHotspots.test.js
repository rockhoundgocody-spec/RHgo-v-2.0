import { describe, it, expect } from 'vitest';
import { SEED_HOTSPOTS, getAugmentedHotspots } from './seedHotspots';

describe('seedHotspots', () => {
  it('contains essential North American rockhounding localities', () => {
    expect(SEED_HOTSPOTS.length).toBeGreaterThanOrEqual(10);
    const names = SEED_HOTSPOTS.map(h => h.name);
    expect(names.some(n => n.includes('Park Point'))).toBe(true);
    expect(names.some(n => n.includes('Petoskey'))).toBe(true);
    expect(names.some(n => n.includes('Crater of Diamonds'))).toBe(true);
    expect(names.some(n => n.includes('Herkimer'))).toBe(true);
  });

  it('augments empty list with seed hotspots', () => {
    const res = getAugmentedHotspots([]);
    expect(res.length).toBe(SEED_HOTSPOTS.length);
  });

  it('preserves live hotspots and avoids duplicates', () => {
    const live = [{ id: 'live-1', name: 'Park Point Beach (Duluth, MN)', lat: 46.77, lng: -92.08 }];
    const res = getAugmentedHotspots(live);
    expect(res.length).toBe(SEED_HOTSPOTS.length);
    expect(res[0].id).toBe('live-1');
  });
});
