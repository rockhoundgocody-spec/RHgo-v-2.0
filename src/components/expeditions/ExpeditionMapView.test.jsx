import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useEffect: vi.fn(),
  };
});

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

  it('renders ExpeditionMapView as a pure function / component without crashing', () => {
    const specimens = [
      { id: '1', mineral_name: 'Quartz', lat: 37.7749, lng: -122.4194, rarity: 'rare' },
    ];
    const hotspots = [
      { id: 'h1', name: 'Crystal Cave', lat: 37.8, lng: -122.4 },
    ];
    const element = ExpeditionMapView({ specimens, hotspots });
    expect(element).toBeDefined();
  });

  it('handles empty inputs', () => {
    const element = ExpeditionMapView({ specimens: [], hotspots: [] });
    expect(element).toBeDefined();
  });
});
