
import { describe, it, expect } from 'vitest';
import { VirtualScroller } from './performanceOptimization';

describe('VirtualScroller DOM XSS Fix & Robustness', () => {
  it('does not use innerHTML to clear container', () => {
    let replaced = false;
    const container = {
      scrollTop: 0,
      clientHeight: 100,
      children: [],
      replaceChildren: function() {
        replaced = true;
        this.children = [];
      },
      appendChild: function(child) {
        this.children.push(child);
      },
      addEventListener: () => {}
    };

    const itemHeight = 20;
    const renderItem = (item) => {
      return { style: {} };
    };

    const scroller = new VirtualScroller(container, itemHeight, renderItem);
    scroller.items = [{ id: 1 }, { id: 2 }];
    scroller.visibleRange = { start: 0, end: 2 };
    scroller.render();

    expect(replaced).toBe(true);
    expect(container.children.length).toBeGreaterThan(0);
  });
});
