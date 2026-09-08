import { describe, expect, it } from 'vitest';
import { haversineKm, planRoute } from './ExpeditionPlanner';

describe('ExpeditionPlanner - haversineKm', () => {
  it('calculates 0 distance between the same coordinates', () => {
    const point = { lat: 37.7749, lng: -122.4194 };
    expect(haversineKm(point, point)).toBe(0);
  });

  it('calculates accurate distance between known points', () => {
    // San Francisco to Los Angeles (~559 km)
    const sf = { lat: 37.7749, lng: -122.4194 };
    const la = { lat: 34.0522, lng: -118.2437 };
    const dist = haversineKm(sf, la);
    expect(dist).toBeGreaterThan(550);
    expect(dist).toBeLessThan(570);
  });
});

describe('ExpeditionPlanner - planRoute optimization', () => {
  it('returns empty route for empty or invalid inputs', () => {
    expect(planRoute(null, [{ id: 1, lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 10, lng: 10 }, [])).toEqual([]);
    expect(planRoute({ lat: 10, lng: 10 }, null)).toEqual([]);
    expect(planRoute({ lat: 10, lng: 10 }, [{ id: 1, lat: 10, lng: 10 }], 0)).toEqual([]);
  });

  it('orders hotspots by nearest neighbor distance', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', lat: 10, lng: 10 },
      { id: 'nearest', lat: 1, lng: 1 },
      { id: 'mid', lat: 5, lng: 5 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route.map(h => h.id)).toEqual(['nearest', 'mid', 'far']);
  });

  it('respects the limit constraint', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = Array.from({ length: 10 }, (_, i) => ({
      id: `h-${i}`,
      lat: i + 1,
      lng: i + 1,
    }));

    const route = planRoute(origin, hotspots, 4);
    expect(route.length).toBe(4);
    expect(route.map(h => h.id)).toEqual(['h-0', 'h-1', 'h-2', 'h-3']);
  });

  it('correctly updates origin sequentially along nearest neighbor path', () => {
    const origin = { lat: 0, lng: 0 };
    // h1 is near origin (0,0) -> (1,0)
    // h2 is far from origin (0,0), but extremely close to h1 -> (1, 0.01)
    // h3 is closer to origin than h2 -> (0.5, 0.5)
    const h1 = { id: 'h1', lat: 1, lng: 0 };
    const h2 = { id: 'h2', lat: 1, lng: 0.01 };
    const h3 = { id: 'h3', lat: 0.5, lng: 0.5 };

    const route = planRoute(origin, [h1, h2, h3], 3);
    // 1st stop from origin (0,0): h3 is at dist ~0.707, h1 is at dist 1. So h3 is nearest.
    // 2nd stop from h3 (0.5, 0.5): h1 is dist ~0.707, h2 is dist ~0.707.
    expect(route[0].id).toBe('h3');
    expect(route.length).toBe(3);
  });
});
