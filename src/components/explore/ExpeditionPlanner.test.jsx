import { describe, expect, it } from 'vitest';
import { planRoute } from './ExpeditionPlanner';

describe('ExpeditionPlanner - planRoute optimization', () => {
  const origin = { lat: 37.7749, lng: -122.4194 }; // San Francisco

  const hotspots = [
    { id: 'far', name: 'Far Away', lat: 38.5816, lng: -121.4944 }, // Sacramento (~120km)
    { id: 'near', name: 'Near Site', lat: 37.8044, lng: -122.2712 }, // Oakland (~12km)
    { id: 'mid', name: 'Mid Site', lat: 37.3382, lng: -121.8863 }, // San Jose (~68km)
    { id: 'super_near', name: 'Super Near', lat: 37.7833, lng: -122.4167 }, // SF Downtown (~1km)
  ];

  it('returns empty array when origin or hotspots are missing or empty', () => {
    expect(planRoute(null, hotspots)).toEqual([]);
    expect(planRoute(origin, null)).toEqual([]);
    expect(planRoute(origin, [])).toEqual([]);
  });

  it('correctly constructs nearest-neighbor route sequence', () => {
    const route = planRoute(origin, hotspots, 4);
    expect(route).toHaveLength(4);
    expect(route[0].id).toBe('super_near');
    expect(route[1].id).toBe('near');
    expect(route[2].id).toBe('mid');
    expect(route[3].id).toBe('far');
  });

  it('respects the stop limit parameter', () => {
    const route = planRoute(origin, hotspots, 2);
    expect(route).toHaveLength(2);
    expect(route.map((r) => r.id)).toEqual(['super_near', 'near']);
  });

  it('handles single hotspot correctly', () => {
    const single = [{ id: 'solo', lat: 37.8, lng: -122.4 }];
    const route = planRoute(origin, single, 6);
    expect(route).toHaveLength(1);
    expect(route[0].id).toBe('solo');
  });
});
