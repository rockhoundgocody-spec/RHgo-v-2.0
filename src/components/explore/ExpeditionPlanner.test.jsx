import React from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

import ExpeditionPlanner, { planRoute } from './ExpeditionPlanner.jsx';

describe('planRoute algorithm', () => {
  it('returns empty array when origin is null or hotspots are empty', () => {
    expect(planRoute(null, [{ id: '1', lat: 10, lng: 10 }])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, [])).toEqual([]);
    expect(planRoute({ lat: 0, lng: 0 }, null)).toEqual([]);
  });

  it('selects nearest neighbors sequentially', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: 'far', lat: 10, lng: 10 },
      { id: 'near', lat: 1, lng: 1 },
      { id: 'mid', lat: 5, lng: 5 },
    ];

    const route = planRoute(origin, hotspots, 3);
    expect(route.map(h => h.id)).toEqual(['near', 'mid', 'far']);
  });

  it('respects the route limit constraint', () => {
    const origin = { lat: 0, lng: 0 };
    const hotspots = [
      { id: '1', lat: 1, lng: 1 },
      { id: '2', lat: 2, lng: 2 },
      { id: '3', lat: 3, lng: 3 },
      { id: '4', lat: 4, lng: 4 },
    ];

    const route = planRoute(origin, hotspots, 2);
    expect(route.length).toBe(2);
    expect(route.map(h => h.id)).toEqual(['1', '2']);
  });
});

describe('ExpeditionPlanner component', () => {
  it('renders trigger button correctly', () => {
    const hotspots = [
      { id: 'h1', lat: 10, lng: 10, minerals: ['Quartz'] },
    ];
    const specimens = [];

    const el = ExpeditionPlanner({
      hotspots,
      specimens,
      userLocation: { lat: 0, lng: 0 },
    });

    expect(el).toBeTruthy();
    expect(el.type).toBe('div');
  });
});
