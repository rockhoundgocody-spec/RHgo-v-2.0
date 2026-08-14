import { describe, it, expect } from 'vitest';
import { validateContrast } from './accessibilityUtils.jsx';

describe('validateContrast', () => {
  it('should return true for maximum contrast (black and white)', () => {
    expect(validateContrast('#000000', '#ffffff')).toBe(true);
    expect(validateContrast('#ffffff', '#000000')).toBe(true);
  });

  it('should return false for very low contrast', () => {
    expect(validateContrast('#ffffff', '#f0f0f0')).toBe(false);
    expect(validateContrast('#000000', '#111111')).toBe(false);
  });

  it('should return false for identical colors', () => {
    expect(validateContrast('#aabbcc', '#aabbcc')).toBe(false);
    expect(validateContrast('#000000', '#000000')).toBe(false);
    expect(validateContrast('#ffffff', '#ffffff')).toBe(false);
  });

  it('should return true for known AA compliant colors (e.g. #767676 and #ffffff)', () => {
    // #767676 on #ffffff is exactly 4.54:1 contrast ratio, passing AA
    expect(validateContrast('#767676', '#ffffff')).toBe(true);
  });

  it('should return false for known failing colors (e.g. #777777 and #ffffff)', () => {
    // #777777 on #ffffff is around 4.47:1 contrast ratio, failing AA
    expect(validateContrast('#777777', '#ffffff')).toBe(false);
  });

  it('should be order independent', () => {
    const color1 = '#123456';
    const color2 = '#fedcba';
    const result1 = validateContrast(color1, color2);
    const result2 = validateContrast(color2, color1);
    expect(result1).toBe(result2);
  });
});
