import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from './performanceOptimization';

describe('Performance Optimization Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should execute the callback after the specified delay', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should only execute the callback once if called multiple times within the delay', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass the latest arguments to the callback', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced('first');
      debounced('second');
      debounced('third');

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledWith('third');
    });

    it('should preserve the this context', () => {
      const context = { value: 42 };
      let capturedThis;
      function fn() {
        capturedThis = this;
      }
      const debounced = debounce(fn, 300);

      debounced.call(context);
      vi.advanceTimersByTime(300);
      expect(capturedThis).toBe(context);
    });
  });

  describe('throttle', () => {
    it('should execute the callback immediately on the first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should ignore subsequent calls within the interval', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled(); // t=0
      throttled(); // ignored
      throttled(); // ignored

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50);
      throttled(); // ignored
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow another execution after the interval has passed', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled(); // t=0
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled(); // t=100
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
