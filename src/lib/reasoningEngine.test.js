import { describe, it, expect, vi } from 'vitest';

// Mock the API client to avoid window ReferenceError
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: vi.fn(),
      },
    },
  },
}));

import { scoreToBand, bandLabel } from './reasoningEngine';

describe('reasoningEngine utilities', () => {
  describe('scoreToBand', () => {
    const cases = [
      { score: 1.0, expected: 'high' },
      { score: 0.8, expected: 'high' },
      { score: 0.75, expected: 'high' },
      { score: 0.74, expected: 'medium' },
      { score: 0.5, expected: 'medium' },
      { score: 0.45, expected: 'medium' },
      { score: 0.44, expected: 'low' },
      { score: 0.1, expected: 'low' },
      { score: 0.0, expected: 'low' },
      { score: -0.1, expected: 'low' },
    ];

    it.each(cases)('should return $expected for score $score', ({ score, expected }) => {
      expect(scoreToBand(score)).toBe(expected);
    });
  });

  describe('bandLabel', () => {
    it('should return "High confidence" for "high"', () => {
      expect(bandLabel('high')).toBe('High confidence');
    });

    it('should return "Moderate confidence" for "medium"', () => {
      expect(bandLabel('medium')).toBe('Moderate confidence');
    });

    it('should return "Low confidence" for "low"', () => {
      expect(bandLabel('low')).toBe('Low confidence');
    });

    it('should return undefined for unknown bands', () => {
      expect(bandLabel('unknown')).toBeUndefined();
    });
  });
});
