import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    self: 1,
    top: 1,
    location: { href: 'http://localhost' },
  };
}

let planRoute;
let ExpeditionPlanner;

describe('ExpeditionPlanner & planRoute', () => {
  beforeAll(async () => {
    const module = await import('./ExpeditionPlanner');
    planRoute = module.planRoute;
    ExpeditionPlanner = module.default;
  });

  describe('planRoute algorithm optimization & correctness', () => {
    it('returns empty array when origin is null or hotspots empty', () => {
      expect(planRoute(null, [{ lat: 10, lng: 10 }])).toEqual([]);
      expect(planRoute({ lat: 10, lng: 10 }, [])).toEqual([]);
    });

    it('orders hotspots by nearest neighbor greedy TSP route', () => {
      const origin = { lat: 0, lng: 0 };
      const hotspots = [
        { id: 'far', name: 'Far Spot', lat: 10, lng: 10 },
        { id: 'near', name: 'Near Spot', lat: 0.1, lng: 0.1 },
        { id: 'mid', name: 'Mid Spot', lat: 1, lng: 1 },
      ];

      const route = planRoute(origin, hotspots);

      expect(route).toHaveLength(3);
      // Nearest to origin (0,0) is 'near' (0.1, 0.1)
      expect(route[0].id).toEqual('near');
      // Nearest to 'near' is 'mid' (1, 1)
      expect(route[1].id).toEqual('mid');
      // Last is 'far' (10, 10)
      expect(route[2].id).toEqual('far');
    });

    it('respects the limit parameter', () => {
      const origin = { lat: 0, lng: 0 };
      const hotspots = Array.from({ length: 10 }, (_, i) => ({
        id: `spot-${i}`,
        lat: i + 1,
        lng: i + 1,
      }));

      const route = planRoute(origin, hotspots, 4);
      expect(route).toHaveLength(4);
      expect(route.map(r => r.id)).toEqual(['spot-0', 'spot-1', 'spot-2', 'spot-3']);
    });
  });

  describe('ExpeditionPlanner component rendering', () => {
    it('renders trigger button with accessibility attributes', () => {
      const element = ExpeditionPlanner({
        hotspots: [{ id: '1', lat: 10, lng: 10, minerals: ['Quartz'] }],
        specimens: [],
      });

      expect(element).toBeDefined();
      const [button] = element.props.children;
      expect(button.props['aria-expanded']).toBe(false);
      expect(button.props['aria-controls']).toBe('expedition-planner-panel');
    });
  });
});
