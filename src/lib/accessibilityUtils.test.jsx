import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prefersReducedMotion } from './accessibilityUtils.jsx';

describe('accessibilityUtils', () => {
  let originalWindow;

  beforeEach(() => {
    // Save original window to restore it later if needed
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    // Restore window
    globalThis.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('prefersReducedMotion', () => {
    it('should return false when window is undefined (e.g. SSR)', () => {
      // Temporarily remove window from globalThis
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        configurable: true,
        writable: true
      });

      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return true when window.matchMedia matches', () => {
      // Mock window and matchMedia
      const matchMediaMock = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(globalThis, 'window', {
        value: { matchMedia: matchMediaMock },
        configurable: true,
        writable: true
      });

      expect(prefersReducedMotion()).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should return false when window.matchMedia does not match', () => {
      // Mock window and matchMedia
      const matchMediaMock = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(globalThis, 'window', {
        value: { matchMedia: matchMediaMock },
        configurable: true,
        writable: true
      });

      expect(prefersReducedMotion()).toBe(false);
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });
});
