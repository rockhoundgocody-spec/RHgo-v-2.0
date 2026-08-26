import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getContrastRatio,
  prefersReducedMotion,
  validateContrast,
} from './accessibilityUtils.jsx';

describe('WCAG contrast utilities', () => {
  it('computes canonical black-on-white contrast', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(validateContrast('#000', '#fff')).toBe(true);
  });

  it('distinguishes colors around the 4.5:1 normal-text threshold', () => {
    expect(getContrastRatio('#767676', '#ffffff')).toBeGreaterThan(4.5);
    expect(validateContrast('#767676', '#ffffff')).toBe(true);
    expect(getContrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
    expect(validateContrast('#777777', '#ffffff')).toBe(false);
  });

  it('rejects malformed or unsupported color values', () => {
    expect(getContrastRatio('black', '#fff')).toBeNull();
    expect(getContrastRatio('#ffff', '#000')).toBeNull();
    expect(validateContrast(null, '#fff')).toBe(false);
  });
});

describe('prefersReducedMotion', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalWindow !== undefined) globalThis.window = originalWindow;
  });

  it('returns false without a browser media-query API', () => {
    vi.stubGlobal('window', {});
    expect(prefersReducedMotion()).toBe(false);
  });

  it('queries and returns the reduced-motion preference', () => {
    const matchMedia = vi.fn(() => ({ matches: true }));
    vi.stubGlobal('window', { matchMedia });

    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});
