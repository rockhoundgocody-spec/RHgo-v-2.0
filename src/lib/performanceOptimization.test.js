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
    const throttledFn = throttle(fn, 100);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not call the function again if called within the interval', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(50);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1); // Still 1 because 50ms < 100ms
  });

  it('should call the function again after the interval has passed', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2); // Now 2 because 100ms has passed
  });

  it('should pass arguments correctly to the throttled function', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('arg1', 'arg2');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should preserve the "this" context', () => {
    const obj = {
      value: 42,
      method: function() {
        return this.value;
      }
    };

    // Create a spy that wraps the method to verify it was called,
    // but we really want to check if the bound context works.
    // However, vitest spies don't preserve `this` perfectly when checking return values
    // unless we capture it.
    let capturedThis = null;
    const fn = function() {
      capturedThis = this;
    };

    const throttledFn = throttle(fn, 100);

    const testObj = {
      run: throttledFn
    };

    testObj.run();
    expect(capturedThis).toBe(testObj);
  });

  it('should handle custom intervals', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 500);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(400);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
