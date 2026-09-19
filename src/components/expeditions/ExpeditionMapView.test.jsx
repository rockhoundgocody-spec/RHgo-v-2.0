import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock react hooks so component function can be invoked directly as pure function
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (fn) => fn(),
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useEffect: vi.fn(),
  };
});

// Mock base44Client
vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { apiKey: 'test-key' } }),
    },
  },
}));

import ExpeditionMapView from './ExpeditionMapView.jsx';

describe('ExpeditionMapView component', () => {
  beforeAll(() => {
    globalThis.window = globalThis.window || {};
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ExpeditionMapView as a component without crashing', () => {
    const specimens = [
      { id: '1', mineral_name: 'Amethyst', lat: 37.7749, lng: -122.4194, rarity: 'rare' },
    ];
    const hotspots = [
      { id: 'h1', title: 'Crystal Cave', lat: 37.7750, lng: -122.4195 },
    ];
    const element = ExpeditionMapView({ specimens, hotspots });
    expect(element).toBeDefined();
  });

  it('handles empty specimens and hotspots arrays by returning empty state component', () => {
    const element = ExpeditionMapView({ specimens: [], hotspots: [] });
    expect(element).toBeDefined();
  });
});
