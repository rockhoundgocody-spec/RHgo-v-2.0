import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  batchDOMUpdates,
  scheduleWork,
  ResponseCache,
  getImageUrl,
} from './performanceOptimization.js';

describe('performanceOptimization utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('debounce', () => {
    it('should delay function execution until specified delay has passed', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on consecutive calls within delay period', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn();
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();

      // Trigger again, resetting the 300ms countdown
      debouncedFn();
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass correct arguments and preserve this context', () => {
      const fn = vi.fn();
      const context = { value: 42 };
      const debouncedFn = debounce(fn, 200);

      debouncedFn.call(context, 'hello', 'world');
      vi.advanceTimersByTime(200);

      expect(fn).toHaveBeenCalledWith('hello', 'world');
      expect(fn.mock.instances[0]).toBe(context);
    });

    it('should default delayMs to 300 if not provided', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn);

      debouncedFn();
      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('first');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('first');
    });

    it('should suppress calls during the interval', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('first');
      vi.advanceTimersByTime(50);
      throttledFn('second');
      throttledFn('third');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow execution after the interval has passed', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('first');
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn('second');

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('second');
    });

    it('should default intervalMs to 100 if not provided', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn);

      throttledFn('a');
      vi.advanceTimersByTime(99);
      throttledFn('b');
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      throttledFn('c');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('c');
    });
  });

  describe('batchDOMUpdates', () => {
    it('should execute reads first and return their values, then execute writes', () => {
      const executionOrder = [];

      const updates = [
        {
          type: 'write',
          fn: () => {
            executionOrder.push('write1');
          },
        },
        {
          type: 'read',
          fn: () => {
            executionOrder.push('read1');
            return 'value1';
          },
        },
        {
          type: 'write',
          fn: () => {
            executionOrder.push('write2');
          },
        },
        {
          type: 'read',
          fn: () => {
            executionOrder.push('read2');
            return 'value2';
          },
        },
      ];

      const readResults = batchDOMUpdates(updates);

      expect(executionOrder).toEqual(['read1', 'read2', 'write1', 'write2']);
      expect(readResults).toEqual(['value1', 'value2']);
    });

    it('should handle empty updates array', () => {
      const readResults = batchDOMUpdates([]);
      expect(readResults).toEqual([]);
    });
  });

  describe('scheduleWork', () => {
    it('should use requestIdleCallback when available on window', () => {
      const callback = vi.fn();
      const options = { timeout: 1000 };
      const mockRequestIdleCallback = vi.fn().mockReturnValue(123);

      vi.stubGlobal('requestIdleCallback', mockRequestIdleCallback);
      vi.stubGlobal('window', {
        requestIdleCallback: mockRequestIdleCallback,
      });

      const id = scheduleWork(callback, options);

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback, options);
      expect(id).toBe(123);
    });

    it('should fall back to setTimeout polyfill when requestIdleCallback is unavailable on window', () => {
      const callback = vi.fn();

      vi.stubGlobal('window', {});

      scheduleWork(callback);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('ResponseCache', () => {
    it('should set and get unexpired items', () => {
      const cache = new ResponseCache(300);
      cache.set('key1', { data: 'test' });

      expect(cache.get('key1')).toEqual({ data: 'test' });
    });

    it('should return null for non-existent items', () => {
      const cache = new ResponseCache(300);
      expect(cache.get('unknown')).toBeNull();
    });

    it('should return null and delete item after expiration', () => {
      const cache = new ResponseCache(10); // 10 seconds TTL
      cache.set('key1', 'value1');

      // 9.9 seconds pass
      vi.advanceTimersByTime(9900);
      expect(cache.get('key1')).toBe('value1');

      // Past 10 seconds (10.1s total)
      vi.advanceTimersByTime(200);
      expect(cache.get('key1')).toBeNull();
      // Second fetch confirms it was deleted
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all cached items', () => {
      const cache = new ResponseCache(300);
      cache.set('a', 1);
      cache.set('b', 2);

      cache.clear();

      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
    });
  });

  describe('getImageUrl', () => {
    it('should return original URL when navigator.connection is unavailable', () => {
      vi.stubGlobal('navigator', {});

      const url = getImageUrl('https://example.com/image.jpg');
      expect(url).toBe('https://example.com/image.jpg');
    });

    it('should return thumbnail URL for slow-2g connection or saveData enabled', () => {
      vi.stubGlobal('navigator', {
        connection: { effectiveType: 'slow-2g', saveData: false },
      });

      expect(getImageUrl('https://example.com/photo.jpg')).toBe(
        'https://example.com/photo-thumb.jpg'
      );

      vi.stubGlobal('navigator', {
        connection: { effectiveType: '4g', saveData: true },
      });

      expect(getImageUrl('https://example.com/photo.png')).toBe(
        'https://example.com/photo-thumb.png'
      );
    });

    it('should return small variant URL for 2g or 3g connection', () => {
      vi.stubGlobal('navigator', {
        connection: { effectiveType: '2g', saveData: false },
      });

      expect(getImageUrl('https://example.com/photo.jpg')).toBe(
        'https://example.com/photo-sm.jpg'
      );

      vi.stubGlobal('navigator', {
        connection: { effectiveType: '3g', saveData: false },
      });

      expect(getImageUrl('https://example.com/photo.png')).toBe(
        'https://example.com/photo-sm.png'
      );
    });

    it('should return original URL for 4g connection', () => {
      vi.stubGlobal('navigator', {
        connection: { effectiveType: '4g', saveData: false },
      });

      expect(getImageUrl('https://example.com/photo.jpg')).toBe(
        'https://example.com/photo.jpg'
      );
    });
  });
});
