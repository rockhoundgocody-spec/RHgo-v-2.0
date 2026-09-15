import { describe, it, expect } from 'vitest';
import { planRoute } from './ExpeditionPlanner';

describe('planRoute', () => {
  it('returns empty route when origin or hotspots are missing or empty', () => {
    expect(planRoute(null, [{ id: 1, lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, [])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, null)).toEqual([]);
  });

  it('selects nearest hotspots sequentially based on origin', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', lat: 10, lng: 10 },
      { id: 'near', lat: 0.1, lng: 0.1 },
      { id: 'mid', lat: 2, lng: 2 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route).toHaveLength(3);
    expect(route[0].id).toBe('near');
    expect(route[1].id).toBe('mid');
    expect(route[2].id).toBe('far');
  });

  it('respects the limit parameter', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 1, lat: 1, lng: 1 },
      { id: 2, lat: 2, lng: 2 },
      { id: 3, lat: 3, lng: 3 },
      { id: 4, lat: 4, lng: 4 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route).toHaveLength(2);
    expect(route[0].id).toBe(1);
    expect(route[1].id).toBe(2);
  });
});
