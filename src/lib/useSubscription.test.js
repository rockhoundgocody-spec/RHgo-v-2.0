import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSubscription } from './useSubscription.js';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock React
vi.mock('react', () => {
  return {
    useState: (initial) => {
      let state = initial;
      const setState = (newVal) => {
        state = typeof newVal === 'function' ? newVal(state) : newVal;
      };
      return [state, setState];
    },
    useEffect: (fn) => {
      fn();
      return () => {};
    }
  };
});

// Mock base44 client
vi.mock('@/api/base44Client', () => {
  return {
    base44: {
      entities: {
        Subscription: {
          filter: vi.fn().mockResolvedValue([])
        }
      }
    }
  };
});

describe('useSubscription', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  it('should initialize and return helper methods', () => {
    const result = useSubscription({ email: 'test@example.com' });
    expect(result).toHaveProperty('isPro');
    expect(result).toHaveProperty('isFamily');
    expect(result).toHaveProperty('isPaid');
    expect(result).toHaveProperty('refresh');
  });
});
