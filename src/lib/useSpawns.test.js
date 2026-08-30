import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock react hooks before importing useSpawns
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useEffect: (effect) => { effect(); },
    useCallback: (fn) => fn,
    useRef: (initial) => ({ current: initial }),
  };
});

const mockList = vi.fn().mockResolvedValue([
  { id: 'spec-1', mineral_name: 'Quartz' },
  { id: 'spec-2', mineral_name: 'Amethyst' },
]);

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        list: (...args) => mockList(...args),
      },
    },
  },
}));

// Mock window and localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

globalThis.window = {
  localStorage: localStorageMock,
};
globalThis.localStorage = localStorageMock;

import useSpawns from './useSpawns';

describe('useSpawns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries base44.entities.Specimen.list with field projection parameters', () => {
    useSpawns({ userLocation: null });

    expect(mockList).toHaveBeenCalledWith('-created_date', 500, 0, ['id', 'mineral_name']);
  });
});
