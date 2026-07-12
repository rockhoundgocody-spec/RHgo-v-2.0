import { vi, describe, it, expect } from 'vitest';

// Mock `@/api/base44Client` to avoid loading browser globals via `appParams`
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: vi.fn(),
      },
    },
  },
}));

import { scoreToBand } from './reasoningEngine.js';

describe('scoreToBand', () => {
  it('should return high for scores >= 0.75', () => {
    expect(scoreToBand(0.75)).toBe('high');
    expect(scoreToBand(0.8)).toBe('high');
    expect(scoreToBand(1.0)).toBe('high');
  });

  it('should return medium for scores < 0.75 and >= 0.45', () => {
    expect(scoreToBand(0.749)).toBe('medium');
    expect(scoreToBand(0.74)).toBe('medium');
    expect(scoreToBand(0.45)).toBe('medium');
    expect(scoreToBand(0.5)).toBe('medium');
  });

  it('should return low for scores < 0.45', () => {
    expect(scoreToBand(0.449)).toBe('low');
    expect(scoreToBand(0.4)).toBe('low');
    expect(scoreToBand(0.0)).toBe('low');
    expect(scoreToBand(-0.5)).toBe('low');
  });
});
