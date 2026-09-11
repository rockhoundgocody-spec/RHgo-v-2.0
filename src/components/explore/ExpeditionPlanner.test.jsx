import { describe, it, expect } from 'vitest';
import { planRoute } from './ExpeditionPlanner';

describe('planRoute optimization', () => {
  it('returns empty array if origin is null or hotspots are empty', () => {
    expect(planRoute(null, [{ id: 1, lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, [])).toEqual([]);
  });

  it('calculates route correctly using nearest neighbor sequence', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', lat: 10, lng: 10 },
      { id: 'near', lat: 1, lng: 1 },
      { id: 'mid', lat: 5, lng: 5 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route.map(h => h.id)).toEqual(['near', 'mid', 'far']);
  });

  it('respects route limit parameter', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'h1', lat: 1, lng: 1 },
      { id: 'h2', lat: 2, lng: 2 },
      { id: 'h3', lat: 3, lng: 3 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route.length).toBe(2);
    expect(route.map(h => h.id)).toEqual(['h1', 'h2']);
  });
});
