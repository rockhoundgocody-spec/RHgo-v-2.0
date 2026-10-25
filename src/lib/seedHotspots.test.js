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

  it('ships only 2-decimal seed coordinates and applies exact ones when given', () => {
    for (const s of SEED_HOTSPOTS) {
      expect(Math.round(s.lat * 100) / 100).toBe(s.lat);
      expect(Math.round(s.lng * 100) / 100).toBe(s.lng);
    }
    const res = getAugmentedHotspots([], [{ id: 'seed-duluth-park-point', lat: 46.7725, lng: -92.0833 }]);
    const duluth = res.find(h => h.id === 'seed-duluth-park-point');
    expect(duluth.lat).toBe(46.7725);
    expect(duluth.coords_precision).toBe('exact');
    expect(res.find(h => h.id === 'seed-crater-of-diamonds').coords_precision).toBe('approximate');
  });

  it('preserves live hotspots and avoids duplicates', () => {
    const live = [{ id: 'live-1', name: 'Park Point Beach (Duluth, MN)', lat: 46.77, lng: -92.08 }];
    const res = getAugmentedHotspots(live);
    expect(res.length).toBe(SEED_HOTSPOTS.length);
    expect(res[0].id).toBe('live-1');
  });
});