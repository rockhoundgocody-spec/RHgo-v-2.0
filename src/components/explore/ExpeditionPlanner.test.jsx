import { describe, it, expect } from 'vitest';
import { haversineKm, planRoute } from './ExpeditionPlanner.jsx';

describe('ExpeditionPlanner - planRoute & haversineKm', () => {
  it('haversineKm calculates distance correctly between two points', () => {
    // Distance from NYC (40.7128, -74.0060) to Boston (42.3601, -71.0589) is ~306 km
    const nyc = { lat: 40.7128, lng: -74.0060 };
    const boston = { lat: 42.3601, lng: -71.0589 };
    const dist = haversineKm(nyc, boston);

    expect(dist).toBeGreaterThan(290);
    expect(dist).toBeLessThan(320);
  });

  it('planRoute returns empty array if origin is missing or hotspots empty', () => {
    expect(planRoute(null, [{ id: '1', lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, [])).toEqual([]);
  });

  it('planRoute selects nearest neighbor iteratively', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', lat: 10, lng: 10 },
      { id: 'near', lat: 1, lng: 1 },
      { id: 'medium', lat: 5, lng: 5 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route.map(h => h.id)).toEqual(['near', 'medium', 'far']);
  });

  it('planRoute respects the limit constraint', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'a', lat: 1, lng: 1 },
      { id: 'b', lat: 2, lng: 2 },
      { id: 'c', lat: 3, lng: 3 },
      { id: 'd', lat: 4, lng: 4 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route).toHaveLength(2);
    expect(route.map(h => h.id)).toEqual(['a', 'b']);
  });
});
