import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import {
  debounce,
  throttle,
  measureRenderTime,
  lazyLoadImages,
  batchDOMUpdates,
  scheduleWork,
  VirtualScroller,
  ResponseCache,
  detectMemoryLeaks,
  getNetworkInfo,
  getImageUrl,
} from './performanceOptimization';

describe('Performance Optimization Utilities', () => {
  beforeAll(() => {
    if (typeof window === 'undefined') {
      global.window = globalThis;
    }
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should delay function execution by specified delayMs', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 200);

      debouncedFn('arg1');
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(199);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');
    });

    it('should reset timer on consecutive calls within delay period', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn('first');
      vi.advanceTimersByTime(200);

      // Call again before 300ms expires
      debouncedFn('second');
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('second');
    });

    it('should use default delay of 300ms if delayMs is omitted', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn);

      debouncedFn();
      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should preserve function context (this binding)', () => {
      const fn = vi.fn(function () {
        return this.value;
      });
      const debouncedFn = debounce(fn, 100);

      const obj = { value: 99, debouncedFn };
      obj.debouncedFn();

      vi.advanceTimersByTime(100);
      expect(fn.mock.instances[0]).toBe(obj);
    });
  });

  describe('throttle', () => {
    it('should execute immediately on first call and ignore calls within interval', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('call1');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('call1');

      throttledFn('call2');
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn('call3');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('call3');
    });

    it('should use default interval of 100ms if omitted', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('measureRenderTime', () => {
    it('should mark performance and measure duration', () => {
      const mockMeasure = { duration: 12.3456 };
      const markSpy = vi.spyOn(performance, 'mark').mockImplementation(() => {});
      const measureSpy = vi.spyOn(performance, 'measure').mockImplementation(() => {});
      const getEntriesSpy = vi.spyOn(performance, 'getEntriesByName').mockReturnValue([mockMeasure]);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const stopMeasure = measureRenderTime('TestComponent');
      expect(markSpy).toHaveBeenCalledWith('TestComponent-start');

      const duration = stopMeasure();

      expect(markSpy).toHaveBeenCalledWith('TestComponent-end');
      expect(measureSpy).toHaveBeenCalledWith('TestComponent', 'TestComponent-start', 'TestComponent-end');
      expect(getEntriesSpy).toHaveBeenCalledWith('TestComponent');
      expect(consoleSpy).toHaveBeenCalledWith('[Perf] TestComponent: 12.35ms');
      expect(duration).toBe(12.3456);
    });
  });

  describe('lazyLoadImages', () => {
    it('should fallback for environments without IntersectionObserver', () => {
      const dummyImg1 = { dataset: { src: 'image1.jpg' }, removeAttribute: vi.fn(), src: '' };
      const dummyImg2 = { dataset: { src: 'image2.jpg' }, removeAttribute: vi.fn(), src: '' };
      const mockContainer = {
        querySelectorAll: vi.fn().mockReturnValue([dummyImg1, dummyImg2]),
      };

      const originalIO = global.window.IntersectionObserver;
      delete global.window.IntersectionObserver;

      lazyLoadImages(mockContainer);

      expect(dummyImg1.src).toBe('image1.jpg');
      expect(dummyImg1.removeAttribute).toHaveBeenCalledWith('data-src');
      expect(dummyImg2.src).toBe('image2.jpg');
      expect(dummyImg2.removeAttribute).toHaveBeenCalledWith('data-src');

      if (originalIO) {
        global.window.IntersectionObserver = originalIO;
      }
    });

    it('should observe images when IntersectionObserver is supported', () => {
      const observeMock = vi.fn();
      const unobserveMock = vi.fn();
      let observerCallback;

      class MockIO {
        constructor(callback) {
          observerCallback = callback;
          this.observe = observeMock;
          this.unobserve = unobserveMock;
        }
      }

      const originalIO = global.window.IntersectionObserver;
      global.window.IntersectionObserver = MockIO;
      global.IntersectionObserver = MockIO;

      const dummyImg = { dataset: { src: 'image.jpg' }, removeAttribute: vi.fn(), src: '' };
      const mockContainer = {
        querySelectorAll: vi.fn().mockReturnValue([dummyImg]),
      };

      lazyLoadImages(mockContainer);

      expect(observeMock).toHaveBeenCalledWith(dummyImg);

      // Simulate intersection
      observerCallback([{ isIntersecting: true, target: dummyImg }]);

      expect(dummyImg.src).toBe('image.jpg');
      expect(dummyImg.removeAttribute).toHaveBeenCalledWith('data-src');
      expect(unobserveMock).toHaveBeenCalledWith(dummyImg);

      if (originalIO) {
        global.window.IntersectionObserver = originalIO;
        global.IntersectionObserver = originalIO;
      } else {
        delete global.window.IntersectionObserver;
        delete global.IntersectionObserver;
      }
    });
  });

  describe('batchDOMUpdates', () => {
    it('should process read operations first and then write operations', () => {
      const executionOrder = [];
      const read1 = vi.fn(() => {
        executionOrder.push('read1');
        return 'data1';
      });
      const read2 = vi.fn(() => {
        executionOrder.push('read2');
        return 'data2';
      });
      const write1 = vi.fn(() => {
        executionOrder.push('write1');
      });

      const updates = [
        { type: 'write', fn: write1 },
        { type: 'read', fn: read1 },
        { type: 'read', fn: read2 },
      ];

      const readResults = batchDOMUpdates(updates);

      expect(executionOrder).toEqual(['read1', 'read2', 'write1']);
      expect(readResults).toEqual(['data1', 'data2']);
    });
  });

  describe('scheduleWork', () => {
    it('should use requestIdleCallback if available', () => {
      const originalRIC = global.window.requestIdleCallback;
      const ricMock = vi.fn().mockReturnValue(123);
      global.window.requestIdleCallback = ricMock;
      global.requestIdleCallback = ricMock;

      const callback = vi.fn();
      const options = { timeout: 1000 };

      const id = scheduleWork(callback, options);

      expect(ricMock).toHaveBeenCalledWith(callback, options);
      expect(id).toBe(123);

      if (originalRIC) {
        global.window.requestIdleCallback = originalRIC;
        global.requestIdleCallback = originalRIC;
      } else {
        delete global.window.requestIdleCallback;
        delete global.requestIdleCallback;
      }
    });

    it('should fallback to setTimeout when requestIdleCallback is unavailable', () => {
      const originalRIC = global.window.requestIdleCallback;
      delete global.window.requestIdleCallback;
      delete global.requestIdleCallback;

      const callback = vi.fn();
      scheduleWork(callback);

      expect(callback).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);

      if (originalRIC) {
        global.window.requestIdleCallback = originalRIC;
        global.requestIdleCallback = originalRIC;
      }
    });
  });

  describe('VirtualScroller', () => {
    it('should render correct visible items based on container scroll position', () => {
      const children = [];
      const listeners = {};

      const mockContainer = {
        clientHeight: 100,
        scrollTop: 0,
        innerHTML: '',
        children,
        addEventListener: vi.fn((event, handler) => {
          listeners[event] = handler;
        }),
        appendChild: vi.fn((el) => {
          children.push(el);
        }),
      };

      const renderItem = vi.fn((item) => ({
        item,
        style: {},
      }));

      const scroller = new VirtualScroller(mockContainer, 20, renderItem);
      scroller.setItems([10, 20, 30, 40, 50, 60, 70, 80]);

      // Trigger scroll event to calculate visibleRange
      scroller.onScroll();

      // Height 100, itemHeight 20 -> items index 0 to 4 (5 items) visible
      expect(children.length).toBe(5);
      expect(children[0].item).toBe(10);
      expect(children[0].style.transform).toBe('translateY(0px)');

      // Simulate scroll to 40px
      children.length = 0;
      mockContainer.scrollTop = 40;
      listeners['scroll']();

      // Start: 40/20 = 2, End: (40+100)/20 = 7. Items index 2 to 6 visible (5 items)
      expect(children.length).toBe(5);
      expect(children[0].item).toBe(30);
      expect(children[0].style.transform).toBe('translateY(40px)');
    });
  });

  describe('ResponseCache', () => {
    it('should cache items and return them within TTL', () => {
      const cache = new ResponseCache(10); // 10 seconds TTL
      cache.set('key1', { foo: 'bar' });

      expect(cache.get('key1')).toEqual({ foo: 'bar' });

      vi.advanceTimersByTime(9000); // 9 seconds
      expect(cache.get('key1')).toEqual({ foo: 'bar' });
    });

    it('should expire and remove items after TTL', () => {
      const cache = new ResponseCache(5); // 5 seconds
      cache.set('key1', 'value1');

      vi.advanceTimersByTime(5001); // Over 5 seconds
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key1')).toBeNull(); // Second access should still be null
    });

    it('should return null for non-existent keys', () => {
      const cache = new ResponseCache();
      expect(cache.get('unknown')).toBeNull();
    });

    it('should clear all cached items', () => {
      const cache = new ResponseCache();
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');

      cache.clear();

      expect(cache.get('k1')).toBeNull();
      expect(cache.get('k2')).toBeNull();
    });
  });

  describe('detectMemoryLeaks', () => {
    it('should return null if performance.memory is undefined', () => {
      const originalMem = performance.memory;
      delete performance.memory;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const res = detectMemoryLeaks();

      expect(res).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Memory API not available in this browser');

      if (originalMem) {
        performance.memory = originalMem;
      }
    });

    it('should return heap stats and warning status when memory API is available', () => {
      Object.defineProperty(performance, 'memory', {
        configurable: true,
        value: {
          usedJSHeapSize: 90 * 1048576,
          jsHeapSizeLimit: 100 * 1048576,
        },
      });

      const res = detectMemoryLeaks();
      expect(res).toEqual({
        usedHeap: '90.00MB',
        totalHeap: '100.00MB',
        usagePercent: '90.0',
        warning: true,
      });
    });
  });

  describe('getNetworkInfo and getImageUrl', () => {
    it('should return network information when navigator.connection exists', () => {
      const mockConn = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      };
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: mockConn,
      });

      const info = getNetworkInfo();
      expect(info).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      });
    });

    it('should return null if navigator.connection is absent', () => {
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: undefined,
      });

      expect(getNetworkInfo()).toBeNull();
      expect(getImageUrl('image.jpg')).toBe('image.jpg');
    });

    it('should adapt image URL based on network conditions', () => {
      const mockConn = { effectiveType: '4g', saveData: false };
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: mockConn,
      });

      expect(getImageUrl('hero.jpg')).toBe('hero.jpg');

      mockConn.effectiveType = '3g';
      expect(getImageUrl('hero.jpg')).toBe('hero-sm.jpg');

      mockConn.effectiveType = '2g';
      expect(getImageUrl('hero.png')).toBe('hero-sm.png');

      mockConn.effectiveType = 'slow-2g';
      expect(getImageUrl('hero.jpg')).toBe('hero-thumb.jpg');

      mockConn.effectiveType = '4g';
      mockConn.saveData = true;
      expect(getImageUrl('hero.jpg')).toBe('hero-thumb.jpg');
    });
  });
});
