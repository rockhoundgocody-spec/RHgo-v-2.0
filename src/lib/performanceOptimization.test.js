import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './performanceOptimization.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute the function after the specified delay', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use default 300ms delay if not specified', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute only once if called multiple times within the delay window', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);

    // Call again before the first delay expires
    debouncedFn();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled(); // The timer was reset

    // Now wait for the second delay to finish
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass the latest arguments to the original function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(50);

    debouncedFn('second', 42);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second', 42);
  });

  it('should preserve the context (this)', () => {
    const obj = {
      val: 10,
      fn: function(multiplier) {
        return this.val * multiplier;
      }
    };

    const spy = vi.spyOn(obj, 'fn');
    const debouncedFn = debounce(obj.fn, 100);

    // Bind the debounced function to our object
    const boundDebouncedFn = debouncedFn.bind(obj);

    boundDebouncedFn(2);
    vi.advanceTimersByTime(100);

    expect(spy).toHaveBeenCalledTimes(1);
    // Since spy wraps the function, its this context is preserved and the function would execute correctly if not mocked
    // To strictly verify context, we check the instances it was called with.
    expect(spy.mock.instances[0]).toBe(obj);
  });
});
