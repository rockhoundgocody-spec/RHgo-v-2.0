import { describe, expect, it } from 'vitest';
import { planRoute } from './ExpeditionPlanner';

describe('planRoute nearest-neighbor optimization', () => {
  it('returns empty array when origin is missing or hotspots are empty', () => {
    expect(planRoute(null, [{ id: 1, lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, [])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, null)).toEqual([]);
  });

  it('orders hotspots in nearest-neighbor sequence', () => {
    const origin = { lat: 37.7749, lng: -122.4194 }; // San Francisco
    const hotspots = [
      { id: 'far', name: 'New York', lat: 40.7128, lng: -74.0060 },
      { id: 'near', name: 'Oakland', lat: 37.8044, lng: -122.2712 },
      { id: 'medium', name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route.map((h) => h.id)).toEqual(['near', 'medium', 'far']);
  });

  it('respects the limit constraint', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'h1', lat: 1, lng: 1 },
      { id: 'h2', lat: 2, lng: 2 },
      { id: 'h3', lat: 3, lng: 3 },
      { id: 'h4', lat: 4, lng: 4 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route).toHaveLength(2);
    expect(route.map((h) => h.id)).toEqual(['h1', 'h2']);
  });

  it('does not mutate the original hotspots array', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'a', lat: 2, lng: 2 },
      { id: 'b', lat: 1, lng: 1 },
    ];
    const originalCopy = [...hotspots];

    planRoute(origin, hotspots, 2);
    expect(hotspots).toEqual(originalCopy);
  });
});
