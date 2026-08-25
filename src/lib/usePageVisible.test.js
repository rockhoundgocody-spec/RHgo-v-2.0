import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

// Mock react's useState and useEffect to inspect hook execution
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
  };
});

import usePageVisible from './usePageVisible.js';

describe('usePageVisible', () => {
  let mockSetVisible;
  let listeners;
  let originalDocument;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetVisible = vi.fn();
    listeners = new Map();

    originalDocument = globalThis.document;

    // Mock document with event listener support
    globalThis.document = {
      hidden: false,
      addEventListener: vi.fn((event, handler) => {
        listeners.set(event, handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (listeners.get(event) === handler) {
          listeners.delete(event);
        }
      }),
    };

    // Default mock behavior for useState and useEffect
    React.useState.mockImplementation((initial) => [
      typeof initial === 'function' ? initial() : initial,
      mockSetVisible,
    ]);

    React.useEffect.mockImplementation((effect) => {
      // Execute effect synchronously for testing
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        React._lastCleanup = cleanup;
      }
    });
  });

  afterEach(() => {
    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    } else {
      delete globalThis.document;
    }
  });

  it('should initialize visible to true when document.hidden is false', () => {
    document.hidden = false;
    const isVisible = usePageVisible();

    expect(isVisible).toBe(true);
    expect(React.useState).toHaveBeenCalledWith(true);
  });

  it('should initialize visible to false when document.hidden is true', () => {
    document.hidden = true;
    const isVisible = usePageVisible();

    expect(isVisible).toBe(false);
    expect(React.useState).toHaveBeenCalledWith(false);
  });

  it('should initialize visible to true when document is undefined (SSR)', () => {
    delete globalThis.document;

    const isVisible = usePageVisible();

    expect(isVisible).toBe(true);
    expect(React.useState).toHaveBeenCalledWith(true);
  });

  it('should attach visibilitychange listener on mount and cleanup on unmount', () => {
    usePageVisible();

    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(listeners.has('visibilitychange')).toBe(true);

    // Trigger cleanup
    if (React._lastCleanup) {
      React._lastCleanup();
    }

    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(listeners.has('visibilitychange')).toBe(false);
  });

  it('should return early from useEffect when document is undefined (SSR)', () => {
    delete globalThis.document;

    usePageVisible();

    expect(React.useEffect).toHaveBeenCalled();
  });

  it('should update visible state when visibilitychange event fires', () => {
    usePageVisible();

    const handler = listeners.get('visibilitychange');
    expect(handler).toBeDefined();

    // Simulate tab hiding
    document.hidden = true;
    handler();
    expect(mockSetVisible).toHaveBeenCalledWith(false);

    // Simulate tab becoming visible
    document.hidden = false;
    handler();
    expect(mockSetVisible).toHaveBeenCalledWith(true);
  });
});
