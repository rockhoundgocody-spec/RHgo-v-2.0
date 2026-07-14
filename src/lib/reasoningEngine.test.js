import { describe, it, expect, vi } from 'vitest';

// Mock `@/api/base44Client` to prevent browser globals errors during test imports
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
  describe('High boundary (score >= 0.75)', () => {
    it('should return "high" for scores greater than 0.75', () => {
      expect(scoreToBand(0.8)).toBe('high');
      expect(scoreToBand(1.0)).toBe('high');
      expect(scoreToBand(5.5)).toBe('high');
    });

    it('should return "high" for the exact threshold of 0.75', () => {
      expect(scoreToBand(0.75)).toBe('high');
    });
  });

  describe('Medium boundary (0.45 <= score < 0.75)', () => {
    it('should return "medium" for scores just below the high threshold', () => {
      expect(scoreToBand(0.7499)).toBe('medium');
      expect(scoreToBand(0.74)).toBe('medium');
    });

    it('should return "medium" for typical medium scores', () => {
      expect(scoreToBand(0.6)).toBe('medium');
      expect(scoreToBand(0.5)).toBe('medium');
    });

    it('should return "medium" for the exact threshold of 0.45', () => {
      expect(scoreToBand(0.45)).toBe('medium');
    });
  });

  describe('Low boundary (score < 0.45)', () => {
    it('should return "low" for scores just below the medium threshold', () => {
      expect(scoreToBand(0.4499)).toBe('low');
      expect(scoreToBand(0.44)).toBe('low');
    });

    it('should return "low" for typical low scores', () => {
      expect(scoreToBand(0.2)).toBe('low');
      expect(scoreToBand(0.0)).toBe('low');
    });

    it('should return "low" for negative scores', () => {
      expect(scoreToBand(-0.5)).toBe('low');
    });
  });
});
