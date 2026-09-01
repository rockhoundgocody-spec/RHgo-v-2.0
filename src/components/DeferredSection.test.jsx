import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockVisible = false;
const mockSetVisible = vi.fn((val) => { mockVisible = val; });
let effectCallback = null;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: () => [mockVisible, mockSetVisible],
    useRef: () => ({ current: { node: 'mock' } }),
    useEffect: (fn) => { effectCallback = fn; },
  };
});

import DeferredSection from './DeferredSection';

describe('DeferredSection', () => {
  beforeEach(() => {
    mockVisible = false;
    mockSetVisible.mockClear();
    effectCallback = null;
  });

  it('renders fallback placeholder div when visible is false', () => {
    const children = <span id="child">Content</span>;
    const element = DeferredSection({ children, minHeight: 100, rootMargin: '200px' });

    expect(element.type).toBe('div');
    expect(element.props.style).toEqual({ minHeight: 100 });
    expect(element.props['aria-hidden']).toBe(true);
    expect(element.props.className).toBe('rounded-2xl');
  });

  it('returns children directly when visible is true', () => {
    mockVisible = true;
    const children = <span id="child">Content</span>;
    const element = DeferredSection({ children, minHeight: 100 });

    expect(element).toBe(children);
  });

  it('sets visible to true if IntersectionObserver is not in window', () => {
    const originalWin = globalThis.window;
    globalThis.window = {};

    const children = <span>Content</span>;
    DeferredSection({ children });

    if (effectCallback) effectCallback();

    expect(mockSetVisible).toHaveBeenCalledWith(true);

    globalThis.window = originalWin;
  });
});
