import { describe, it, expect, vi } from 'vitest';
import { VirtualScroller, ResponseCache } from './performanceOptimization';

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

  it('ResponseCache should cache and respect expiry TTL', () => {
    const cache = new ResponseCache(60);
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('non_existent')).toBeNull();

    cache.clear();
    expect(cache.get('key1')).toBeNull();
  });
});
