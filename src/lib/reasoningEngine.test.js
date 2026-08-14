import { describe, it, expect, vi } from 'vitest';
import { scoreToBand, bandLabel } from './reasoningEngine.js';

vi.mock('@/api/base44Client', () => ({
  base44: {}
}));

describe('reasoningEngine bands', () => {
  describe('scoreToBand', () => {
    it('returns "high" for scores >= 0.75', () => {
      expect(scoreToBand(0.75)).toBe('high');
      expect(scoreToBand(0.9)).toBe('high');
      expect(scoreToBand(1.0)).toBe('high');
    });

    it('returns "medium" for scores between 0.45 and 0.74', () => {
      expect(scoreToBand(0.45)).toBe('medium');
      expect(scoreToBand(0.6)).toBe('medium');
      expect(scoreToBand(0.749)).toBe('medium');
    });

    it('returns "low" for scores < 0.45', () => {
      expect(scoreToBand(0.44)).toBe('low');
      expect(scoreToBand(0.1)).toBe('low');
      expect(scoreToBand(0)).toBe('low');
      expect(scoreToBand(-1)).toBe('low');
    });
  });

  describe('bandLabel', () => {
    it('returns the correct label for "high"', () => {
      expect(bandLabel('high')).toBe('High confidence');
    });

    it('returns the correct label for "medium"', () => {
      expect(bandLabel('medium')).toBe('Moderate confidence');
    });

    it('returns the correct label for "low"', () => {
      expect(bandLabel('low')).toBe('Low confidence');
    });

    it('returns undefined for unknown bands', () => {
      expect(bandLabel('unknown')).toBeUndefined();
    });
  });
});
