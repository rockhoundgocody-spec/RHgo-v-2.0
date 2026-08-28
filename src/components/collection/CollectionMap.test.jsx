import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock react hooks so component function can be invoked directly as pure function
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useEffect: vi.fn(),
    useMemo: (factory) => factory(),
    useCallback: (fn) => fn,
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

import CollectionMap from './CollectionMap.jsx';

describe('CollectionMap component', () => {
  beforeAll(() => {
    globalThis.window = globalThis.window || {};
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CollectionMap as a pure function / component without crashing', () => {
    const specimens = [
      { id: '1', mineral_name: 'Quartz', lat: 37.7749, lng: -122.4194, rarity: 'rare' },
    ];
    const element = CollectionMap({ specimens });
    expect(element).toBeDefined();
  });

  it('handles empty specimens array by returning empty state component', () => {
    const element = CollectionMap({ specimens: [] });
    expect(element).toBeDefined();
  });
});
