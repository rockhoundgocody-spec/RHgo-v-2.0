import { afterEach, describe, it, expect, vi } from 'vitest';
import { debounce, throttle, VirtualScroller, ResponseCache } from './performanceOptimization';

describe('debounce', () => {
  afterEach(() => vi.useRealTimers());

  it('delays execution and resets the timer after repeated calls', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('first');
    vi.advanceTimersByTime(75);
    debounced('latest');
    vi.advanceTimersByTime(99);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('latest');
  });

  it('preserves the caller context', () => {
    vi.useFakeTimers();
    const callback = vi.fn(function () {
      return this.name;
    });
    const owner = { name: 'Clover', run: debounce(callback, 10) };

    owner.run();
    vi.advanceTimersByTime(10);

    expect(callback.mock.instances[0]).toBe(owner);
  });

  it('uses the 300ms default delay', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    debounce(callback)();
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
  });
});

describe('throttle', () => {
  afterEach(() => vi.useRealTimers());

  it('executes the first call immediately, including at the Unix epoch', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const callback = vi.fn();

    throttle(callback, 100)('first');

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('first');
  });

  it('ignores calls inside the interval and permits the boundary call', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const callback = vi.fn();
    const throttled = throttle(callback, 100);

    throttled('first');
    vi.advanceTimersByTime(99);
    throttled('blocked');
    expect(callback).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1);
    throttled('boundary');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('boundary');
  });

  it('uses the 100ms default interval', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const throttled = throttle(callback);

    throttled();
    vi.advanceTimersByTime(99);
    throttled();
    expect(callback).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1);
    throttled();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('preserves the caller context', () => {
    const callback = vi.fn(function () { return this.name; });
    const owner = { name: 'Clover', run: throttle(callback, 10) };

    owner.run();

    expect(callback.mock.instances[0]).toBe(owner);
  });
});

describe('Performance Optimization Utilities - VirtualScroller & Helpers', () => {
  it('should render items safely using replaceChildren without innerHTML', () => {
    const children = [];
    const container = {
      clientHeight: 100,
      scrollTop: 0,
      children,
      replaceChildren: vi.fn(function () {
        children.length = 0;
      }),
      appendChild: vi.fn(function (el) {
        children.push(el);
      }),
      addEventListener: vi.fn(),
    };

    const renderItem = (item, index) => {
      return { style: {}, textContent: `Item ${item.name} at index ${index}` };
    };

    const scroller = new VirtualScroller(container, 20, renderItem);
    scroller.visibleRange = { start: 0, end: 3 };

    const items = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    scroller.setItems(items);

    expect(container.replaceChildren).toHaveBeenCalled();
    expect(container.children.length).toBe(3);
    expect(container.children[0].textContent).toBe('Item A at index 0');
    expect(container.children[1].textContent).toBe('Item B at index 1');
    expect(container.children[2].textContent).toBe('Item C at index 2');
  });

  it('should clear old items on re-render using replaceChildren', () => {
    const children = [];
    const container = {
      clientHeight: 100,
      scrollTop: 0,
      children,
      replaceChildren: vi.fn(function () {
        children.length = 0;
      }),
      appendChild: vi.fn(function (el) {
        children.push(el);
      }),
      addEventListener: vi.fn(),
    };

    const renderItem = (item) => ({ style: {}, textContent: item });

    const scroller = new VirtualScroller(container, 10, renderItem);
    scroller.visibleRange = { start: 0, end: 2 };

    scroller.setItems(['First', 'Second']);
    expect(container.children.length).toBe(2);

    scroller.visibleRange = { start: 0, end: 1 };
    scroller.setItems(['UpdatedFirst']);
    expect(container.replaceChildren).toHaveBeenCalledTimes(2);
    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toBe('UpdatedFirst');
  });

});

describe('ResponseCache', () => {
  afterEach(() => vi.useRealTimers());

  it('returns null for unknown keys and preserves stored object identity', () => {
    const cache = new ResponseCache(60);
    const value = { minerals: ['quartz'] };

    expect(cache.get('missing')).toBeNull();
    cache.set('finds', value);
    expect(cache.get('finds')).toBe(value);
  });

  it('expires entries exactly at the configured TTL boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00Z'));
    const cache = new ResponseCache(60);
    cache.set('finds', 'fresh');

    vi.advanceTimersByTime(59_999);
    expect(cache.get('finds')).toBe('fresh');
    vi.advanceTimersByTime(1);
    expect(cache.get('finds')).toBeNull();
  });

  it('can replace an expired key with a fresh value', () => {
    vi.useFakeTimers();
    const cache = new ResponseCache(1);
    cache.set('finds', 'old');
    vi.advanceTimersByTime(1_000);

    expect(cache.get('finds')).toBeNull();
    cache.set('finds', 'new');
    expect(cache.get('finds')).toBe('new');
  });

  it('clears every cached response', () => {
    const cache = new ResponseCache(60);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });
});
