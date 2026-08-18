import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualScroller } from './performanceOptimization.js';

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this._textContent = '';
    this.events = {};
    this.clientHeight = 200;
    this.scrollTop = 0;
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(val) {
    this._textContent = val;
    if (val === '') {
      this.children = [];
    }
  }

  addEventListener(event, handler) {
    this.events[event] = handler;
  }

  appendChild(child) {
    this.children.push(child);
  }
}

describe('VirtualScroller', () => {
  let container;

  beforeEach(() => {
    container = new MockElement('div');
  });

  it('renders items without innerHTML and clears container via textContent', () => {
    const renderItem = (item, index) => {
      const el = new MockElement('div');
      el.textContent = `Item ${item.name} at index ${index}`;
      return el;
    };

    const scroller = new VirtualScroller(container, 50, renderItem);
    scroller.setItems([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }]);

    scroller.onScroll();

    // container clientHeight = 200, itemHeight = 50 -> start: 0, end: Math.ceil(200/50) = 4
    expect(container.children.length).toBe(4);
    expect(container.children[0].textContent).toBe('Item A at index 0');
    expect(container.children[3].textContent).toBe('Item D at index 3');

    // Update items to verify container is safely cleared via textContent
    scroller.setItems([{ name: 'X' }, { name: 'Y' }]);
    scroller.onScroll();
    expect(container.textContent).toBe('');
    expect(container.children.length).toBe(2);
    expect(container.children[0].textContent).toBe('Item X at index 0');
    expect(container.children[1].textContent).toBe('Item Y at index 1');
  });

  it('renders correctly on scroll', () => {
    const renderItem = (item, index) => {
      const el = new MockElement('div');
      el.textContent = `Item ${index}`;
      return el;
    };

    const scroller = new VirtualScroller(container, 50, renderItem);
    const items = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    scroller.setItems(items);
    scroller.onScroll();

    expect(container.children[0].textContent).toBe('Item 0');

    // Scroll down
    container.scrollTop = 150;
    scroller.onScroll();

    // scrollTop=150 / 50 = start: 3, end: Math.ceil((150+200)/50) = 7
    expect(container.children[0].textContent).toBe('Item 3');
  });
});
