import { describe, expect, it } from 'vitest';
import { planRoute } from './ExpeditionPlanner.jsx';

describe('planRoute', () => {
  it('returns empty array when origin or hotspots are missing or empty', () => {
    expect(planRoute(null, [{ id: 1, lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, [])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, null)).toEqual([]);
  });

  it('selects nearest neighbours iteratively', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', lat: 10, lng: 10 },
      { id: 'near', lat: 0.1, lng: 0.1 },
      { id: 'mid', lat: 1, lng: 1 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route.map((h) => h.id)).toEqual(['near', 'mid', 'far']);
  });

  it('respects route length limit parameter', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = Array.from({ length: 20 }, (_, i) => ({
      id: `h_${i}`,
      lat: (i + 1) * 0.1,
      lng: (i + 1) * 0.1,
    }));

    const route = planRoute(origin, hotspots, 4);
    expect(route.length).toBe(4);
    expect(route[0].id).toBe('h_0');
    expect(route[3].id).toBe('h_3');
  });

  it('handles large hotspot sets efficiently', () => {
    const origin = { lat: 37.7749, lng: -122.4194 };
    const hotspots = Array.from({ length: 500 }, (_, i) => ({
      id: `site_${i}`,
      lat: 37.7749 + (Math.sin(i) * 2),
      lng: -122.4194 + (Math.cos(i) * 2),
    }));

    const start = performance.now();
    const route = planRoute(origin, hotspots, 6);
    const duration = performance.now() - start;

    expect(route.length).toBe(6);
    expect(duration).toBeLessThan(50); // Should execute in under 50ms
  });
});
