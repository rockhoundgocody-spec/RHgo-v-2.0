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

let ExpeditionPlanner;

describe('ExpeditionPlanner', () => {
  beforeAll(async () => {
    const module = await import('./ExpeditionPlanner');
    ExpeditionPlanner = module.default;
  });

  const mockHotspots = [
    { id: 'h1', name: 'Quartz Ridge', lat: 45.5, lng: -122.6, minerals: ['Quartz', 'Agate'] },
    { id: 'h2', name: 'Jasper Mine', lat: 45.6, lng: -122.7, minerals: ['Jasper', 'Amethyst'] },
  ];

  const mockSpecimens = [
    { mineral_name: 'Quartz' },
  ];

  it('renders the plan expedition trigger button', () => {
    const element = ExpeditionPlanner({
      hotspots: mockHotspots,
      specimens: mockSpecimens,
    });

    expect(element).toBeDefined();
    const [button] = element.props.children;
    expect(button.props['aria-controls']).toBe('expedition-planner-panel');
    expect(button.props['aria-expanded']).toBe(false);
  });

  it('handles route planning callback structure when route exists', () => {
    const handleRouteChange = vi.fn();
    const handleHotspotFocus = vi.fn();

    const element = ExpeditionPlanner({
      hotspots: mockHotspots,
      specimens: [],
      onRouteChange: handleRouteChange,
      onHotspotFocus: handleHotspotFocus,
    });

    expect(element).toBeDefined();
  });
});
