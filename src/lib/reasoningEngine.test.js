import { describe, it, expect } from 'vitest';
import { scoreToBand, bandLabel } from './reasoningEngine';

describe('reasoningEngine', () => {
  describe('scoreToBand', () => {
    it('should return "high" for scores >= 0.75', () => {
      expect(scoreToBand(0.75)).toBe('high');
      expect(scoreToBand(0.8)).toBe('high');
      expect(scoreToBand(1.0)).toBe('high');
    });

    it('should return "medium" for scores between 0.45 and 0.75', () => {
      expect(scoreToBand(0.45)).toBe('medium');
      expect(scoreToBand(0.5)).toBe('medium');
      expect(scoreToBand(0.74)).toBe('medium');
    });

    it('should return "low" for scores < 0.45', () => {
      expect(scoreToBand(0.44)).toBe('low');
      expect(scoreToBand(0)).toBe('low');
      expect(scoreToBand(-0.1)).toBe('low');
    });
  });

  describe('bandLabel', () => {
    it('should return "High confidence" for "high" band', () => {
      expect(bandLabel('high')).toBe('High confidence');
    });

    it('should return "Moderate confidence" for "medium" band', () => {
      expect(bandLabel('medium')).toBe('Moderate confidence');
    });

    it('should return "Low confidence" for "low" band', () => {
      expect(bandLabel('low')).toBe('Low confidence');
    });

    it('should return undefined for unknown band', () => {
      expect(bandLabel('unknown')).toBeUndefined();
    });
  });
});
