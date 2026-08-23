import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let stateSetter;
let effectCallback;
let effectCleanup;

vi.mock('react', () => ({
  useState: (initialValue) => {
    let state = initialValue;
    stateSetter = vi.fn((newValue) => {
      if (typeof newValue === 'function') {
        state = newValue(state);
      } else {
        state = newValue;
      }
      return state;
    });
    return [state, stateSetter];
  },
  useEffect: (callback) => {
    effectCallback = callback;
  },
}));

import { useReducedMotion } from './useReducedMotion.js';

describe('useReducedMotion', () => {
  let listeners = {};
  let mockMediaQuery;

  beforeEach(() => {
    listeners = {};
    stateSetter = undefined;
    effectCallback = undefined;
    effectCleanup = undefined;

    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (listeners[event] === handler) {
          delete listeners[event];
        }
      }),
    };

    globalThis.window = {
      matchMedia: vi.fn().mockImplementation((query) => {
        mockMediaQuery.media = query;
        return mockMediaQuery;
      }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries prefers-reduced-motion media query and sets initial state when matched', () => {
    mockMediaQuery.matches = true;

    const initialResult = useReducedMotion();
    expect(initialResult).toBe(false);

    // Execute effect callback simulating React running useEffect
    effectCleanup = effectCallback();

    expect(globalThis.window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(stateSetter).toHaveBeenCalledWith(true);
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates state when change event fires on media query', () => {
    mockMediaQuery.matches = false;

    useReducedMotion();
    effectCleanup = effectCallback();

    expect(stateSetter).toHaveBeenCalledWith(false);
    expect(listeners['change']).toBeDefined();

    // Trigger change event with reduced motion preferred
    listeners['change']({ matches: true });
    expect(stateSetter).toHaveBeenCalledWith(true);

    // Trigger change event with reduced motion disabled
    listeners['change']({ matches: false });
    expect(stateSetter).toHaveBeenCalledWith(false);
  });

  it('removes change event listener on effect cleanup', () => {
    mockMediaQuery.matches = false;

    useReducedMotion();
    effectCleanup = effectCallback();

    const registeredHandler = listeners['change'];
    expect(registeredHandler).toBeDefined();

    // Run cleanup callback
    effectCleanup();

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', registeredHandler);
    expect(listeners['change']).toBeUndefined();
  });
});
