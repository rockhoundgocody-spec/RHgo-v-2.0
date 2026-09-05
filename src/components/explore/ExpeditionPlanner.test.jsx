import { describe, expect, it } from 'vitest';
import { planRoute } from './ExpeditionPlanner.jsx';

describe('planRoute', () => {
  it('returns an empty array when origin or hotspots are empty', () => {
    expect(planRoute(null, [{ id: '1', lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 10, lng: 10 }, [])).toEqual([]);
  });

  it('selects the closest hotspot first using nearest-neighbour pathfinding', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', name: 'Far Site', lat: 10, lng: 10 },
      { id: 'close', name: 'Close Site', lat: 0.1, lng: 0.1 },
      { id: 'mid', name: 'Mid Site', lat: 1, lng: 1 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route.map(h => h.id)).toEqual(['close', 'mid', 'far']);
  });

  it('respects the limit parameter', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: '1', lat: 0.1, lng: 0.1 },
      { id: '2', lat: 0.2, lng: 0.2 },
      { id: '3', lat: 0.3, lng: 0.3 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route.length).toBe(2);
    expect(route.map(h => h.id)).toEqual(['1', '2']);
  });

  it('handles custom origins correctly', () => {
    const origin = { lat: 10, lng: 10 };
    const hotspots = [
      { id: 'A', lat: 0, lng: 0 },
      { id: 'B', lat: 9.9, lng: 9.9 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route[0].id).toBe('B');
    expect(route[1].id).toBe('A');
  });
});
