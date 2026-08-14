import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './performanceOptimization.js';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call the function immediately on the first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not call the function again within the interval', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled(); // t=0
    throttled(); // t=0

    vi.advanceTimersByTime(50);
    throttled(); // t=50

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call the function again after the interval has passed', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled(); // t=0

    vi.advanceTimersByTime(100);
    throttled(); // t=100

    expect(fn).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(99);
    throttled(); // t=199

    expect(fn).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1);
    throttled(); // t=200

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should pass arguments to the throttled function', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('arg1', 'arg2');

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should preserve the "this" context', () => {
    const obj = {
      val: 42,
      method: function() {
        return this.val;
      }
    };

    const fn = vi.fn(obj.method);
    obj.throttledMethod = throttle(fn, 100);

    obj.throttledMethod();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.instances[0]).toBe(obj);
  });
});
