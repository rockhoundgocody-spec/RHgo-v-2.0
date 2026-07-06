import { describe, it, expect } from 'vitest';
import { recommendAction, scoreToBand, bandLabel } from './reasoningEngine';

describe('reasoningEngine utilities', () => {
  describe('scoreToBand', () => {
    it('should return "high" for scores >= 0.75', () => {
      expect(scoreToBand(0.75)).toBe('high');
      expect(scoreToBand(0.9)).toBe('high');
    });

    it('should return "medium" for scores between 0.45 and 0.75', () => {
      expect(scoreToBand(0.45)).toBe('medium');
      expect(scoreToBand(0.6)).toBe('medium');
      expect(scoreToBand(0.74)).toBe('medium');
    });

    it('should return "low" for scores < 0.45', () => {
      expect(scoreToBand(0.44)).toBe('low');
      expect(scoreToBand(0.1)).toBe('low');
    });
  });

  describe('bandLabel', () => {
    it('should return correct labels for bands', () => {
      expect(bandLabel('high')).toBe('High confidence');
      expect(bandLabel('medium')).toBe('Moderate confidence');
      expect(bandLabel('low')).toBe('Low confidence');
    });
  });

  describe('recommendAction', () => {
    it('should return "rescan" if isOffline is true', () => {
      expect(recommendAction({ isOffline: true })).toBe('rescan');
    });

    it('should return "rescan" if needsMoreEvidence is true', () => {
      expect(recommendAction({ needsMoreEvidence: true })).toBe('rescan');
    });

    it('should return "rescan" if band is "low"', () => {
      expect(recommendAction({ band: 'low', isOffline: false, needsMoreEvidence: false })).toBe('rescan');
    });

    it('should return "compare" if band is "medium"', () => {
      expect(recommendAction({ band: 'medium', isOffline: false, needsMoreEvidence: false })).toBe('compare');
    });

    it('should return "save" if task is "identify" and band is "high"', () => {
      expect(recommendAction({ band: 'high', task: 'identify', isOffline: false, needsMoreEvidence: false })).toBe('save');
    });

    it('should return "list" if task is "value_estimate" and band is "high"', () => {
      expect(recommendAction({ band: 'high', task: 'value_estimate', isOffline: false, needsMoreEvidence: false })).toBe('list');
    });

    it('should return "save" as default for high confidence unknown tasks', () => {
      expect(recommendAction({ band: 'high', task: 'unknown', isOffline: false, needsMoreEvidence: false })).toBe('save');
    });
  });
});
