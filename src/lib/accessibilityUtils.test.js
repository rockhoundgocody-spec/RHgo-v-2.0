import { describe, it, expect } from 'vitest';
import { validateContrast } from './accessibilityUtils.jsx';

describe('validateContrast', () => {
  it('returns true for high contrast colors (Black and White)', () => {
    // Contrast ratio: 21:1
    expect(validateContrast('#000000', '#ffffff')).toBe(true);
    expect(validateContrast('#ffffff', '#000000')).toBe(true);
  });

  it('returns false for low contrast colors (Gray and White)', () => {
    // Contrast ratio: ~3.9:1
    expect(validateContrast('#808080', '#ffffff')).toBe(false);
  });

  it('returns true for exactly AA passing contrast', () => {
    // Contrast ratio: ~4.54:1
    expect(validateContrast('#767676', '#ffffff')).toBe(true);
  });

  it('returns false for failing AA contrast', () => {
    // Contrast ratio: ~4.48:1
    expect(validateContrast('#777777', '#ffffff')).toBe(false);
  });

  it('returns false when both colors are exactly the same', () => {
    // Contrast ratio: 1:1
    expect(validateContrast('#ffffff', '#ffffff')).toBe(false);
    expect(validateContrast('#000000', '#000000')).toBe(false);
    expect(validateContrast('#123456', '#123456')).toBe(false);
  });
});
