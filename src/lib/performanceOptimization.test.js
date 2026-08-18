import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  VirtualScroller,
  ResponseCache,
} from './performanceOptimization.js';

// Minimal mock DOM element implementation for node environment
function createMockElement(tagName = 'div') {
  const element = {
    tagName: tagName.toUpperCase(),
    children: [],
    style: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    get textContent() {
      return this._textContent || '';
    },
    set textContent(val) {
      this._textContent = val;
      if (val === '') {
        this.children = [];
      }
    },
    clientHeight: 100,
    scrollTop: 0,
  };
  return element;
}

describe('performanceOptimization', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('throttles function execution', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('VirtualScroller', () => {
    let container;

    beforeEach(() => {
      container = createMockElement('div');
    });

    it('renders visible items safely using textContent clearing', () => {
      const renderItem = (item) => {
        const el = createMockElement('div');
        el.textContent = `Item ${item}`;
        return el;
      };

      const scroller = new VirtualScroller(container, 20, renderItem);
      scroller.setItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      scroller.onScroll();

      expect(container.children.length).toBe(5); // 0..5
      expect(container.children[0].textContent).toBe('Item 1');

      // Update items to verify container is cleared properly using textContent = ''
      scroller.setItems([100, 200]);
      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe('Item 100');
    });

    it('updates visible range on scroll', () => {
      const renderItem = (item) => {
        const el = createMockElement('div');
        el.textContent = `Item ${item}`;
        return el;
      };

      const scroller = new VirtualScroller(container, 20, renderItem);
      scroller.setItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      container.scrollTop = 40;
      scroller.onScroll();

      expect(scroller.visibleRange.start).toBe(2);
      expect(scroller.visibleRange.end).toBe(7);
      expect(container.children[0].textContent).toBe('Item 3');
    });
  });

  describe('ResponseCache', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('stores and retrieves cached items until expired', () => {
      const cache = new ResponseCache(10); // 10s TTL
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(11000);
      expect(cache.get('key1')).toBeNull();
    });
  });
});
