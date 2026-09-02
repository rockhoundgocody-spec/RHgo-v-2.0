import { describe, it, expect } from 'vitest';
import { planRoute } from './ExpeditionPlanner.jsx';

describe('planRoute algorithm optimization', () => {
  it('returns empty array if origin or hotspots is missing/empty', () => {
    expect(planRoute(null, [{ id: 1, lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, [])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, null)).toEqual([]);
  });

  it('selects nearest hotspot iteratively', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', lat: 10, lng: 10 },
      { id: 'near', lat: 0.1, lng: 0.1 },
      { id: 'medium', lat: 2, lng: 2 },
    ];

    const route = planRoute(origin, hotspots);
    expect(route.map(h => h.id)).toEqual(['near', 'medium', 'far']);
  });

  it('respects limit parameter', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'h1', lat: 1, lng: 1 },
      { id: 'h2', lat: 2, lng: 2 },
      { id: 'h3', lat: 3, lng: 3 },
      { id: 'h4', lat: 4, lng: 4 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route).toHaveLength(2);
    expect(route.map(h => h.id)).toEqual(['h1', 'h2']);
  });
});
