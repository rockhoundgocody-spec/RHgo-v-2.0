import { describe, it, expect, vi, beforeEach } from 'vitest';

let currentState;
let stateSetter;
let effectCallback;

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => {
      currentState = initial;
      stateSetter = vi.fn((val) => {
        currentState = typeof val === 'function' ? val(currentState) : val;
      });
      return [currentState, stateSetter];
    },
    useEffect: (cb) => {
      effectCallback = cb;
    },
  };
});

import useReducedMotionDefault, { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  let listeners;
  let mockMediaQueryList;

  beforeEach(() => {
    currentState = false;
    stateSetter = null;
    effectCallback = null;
    listeners = new Set();

    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          listeners.add(handler);
        }
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          listeners.delete(handler);
        }
      }),
    };

    globalThis.window = {
      matchMedia: vi.fn(() => mockMediaQueryList),
    };
  });

  it('exports both named and default export as the same function', () => {
    expect(useReducedMotion).toBeTypeOf('function');
    expect(useReducedMotionDefault).toBe(useReducedMotion);
  });

  it('initializes to false and queries prefers-reduced-motion media query', () => {
    mockMediaQueryList.matches = false;

    const result = useReducedMotion();

    expect(result).toBe(false);
    expect(globalThis.window.matchMedia).not.toHaveBeenCalled();

    // Trigger effect
    const cleanup = effectCallback();

    expect(globalThis.window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(stateSetter).toHaveBeenCalledWith(false);
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    if (typeof cleanup === 'function') {
      cleanup();
    }
  });

  it('updates state to true when media query matches reduce preference on mount', () => {
    mockMediaQueryList.matches = true;

    useReducedMotion();

    // Trigger effect
    const cleanup = effectCallback();

    expect(globalThis.window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(stateSetter).toHaveBeenCalledWith(true);
    expect(currentState).toBe(true);

    if (typeof cleanup === 'function') {
      cleanup();
    }
  });

  it('handles media query change events when reduced motion preference changes', () => {
    mockMediaQueryList.matches = false;

    useReducedMotion();
    const cleanup = effectCallback();

    expect(listeners.size).toBe(1);

    // Simulate change event to prefers-reduced-motion: reduce = true
    const changeHandler = Array.from(listeners)[0];
    changeHandler({ matches: true });

    expect(stateSetter).toHaveBeenCalledWith(true);
    expect(currentState).toBe(true);

    // Simulate change event back to prefers-reduced-motion: reduce = false
    changeHandler({ matches: false });

    expect(stateSetter).toHaveBeenCalledWith(false);
    expect(currentState).toBe(false);

    if (typeof cleanup === 'function') {
      cleanup();
    }
  });

  it('removes change event listener on cleanup', () => {
    mockMediaQueryList.matches = false;

    useReducedMotion();
    const cleanup = effectCallback();

    expect(listeners.size).toBe(1);
    const registeredHandler = Array.from(listeners)[0];

    // Trigger cleanup
    cleanup();

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', registeredHandler);
    expect(listeners.size).toBe(0);
  });
});
