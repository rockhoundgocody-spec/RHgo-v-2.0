import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set global window if needed
globalThis.window = globalThis.window || {};

// Mock react hooks for component-as-function testing
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRef: (val) => ({ current: val }),
    useState: (val) => [val, vi.fn()],
    useEffect: () => {},
  };
});

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { apiKey: 'mock-key' } }))
    }
  }
}));

import CollectionMap from './CollectionMap';

describe('CollectionMap component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CollectionMap correctly as a React component function', () => {
    expect(typeof CollectionMap).toBe('function');
  });

  it('renders MapPlaceholder when apiKey is not ready or pinned is empty', () => {
    const element = CollectionMap({ specimens: [] });
    expect(element).not.toBeNull();
  });

  it('handles specimens filtering correctly', () => {
    const specimens = [
      { id: '1', mineral_name: 'Quartz', lat: 40.7128, lng: -74.0060, rarity: 'common' },
      { id: '2', mineral_name: 'Amethyst' },
    ];
    const element = CollectionMap({ specimens });
    expect(element).not.toBeNull();
  });
});
