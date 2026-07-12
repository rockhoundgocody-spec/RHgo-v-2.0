import { describe, it, expect } from 'vitest';
import {
  highLevelPlan,
  scoreToBand,
  bandLabel,
  shouldHalt,
  recommendAction
} from './reasoningEngine.js';

describe('highLevelPlan', () => {
  it('should return default state when no inputs are provided', () => {
    const result = highLevelPlan({ task: 'identify' });
    expect(result.evidenceScore).toBe(0);
    expect(result.evidenceList).toEqual([]);
    expect(result.hints).toContain('Add at least one clear photo');
    expect(result.hints).toContain('Share your location for geological context');
    expect(result.hints).toContain('Note color, luster, or crystal habit');
    expect(result.needsMoreEvidence).toBe(true);
    expect(result.isOffline).toBe(false);
  });

  it('should handle single photo', () => {
    const result = highLevelPlan({ task: 'identify', imageUrls: ['photo1.png'] });
    expect(result.evidenceScore).toBe(0.25);
    expect(result.evidenceList).toEqual([
      { type: 'image', label: '1 photo', weight: 0.5 }
    ]);
    expect(result.hints).toContain('Multiple angles improve accuracy');
    expect(result.needsMoreEvidence).toBe(false); // evidenceScore >= 0.2 and imageUrls.length > 0
  });

  it('should cap photo evidence score at 0.5', () => {
    const resultOne = highLevelPlan({ task: 'identify', imageUrls: ['p1.png', 'p2.png'] });
    expect(resultOne.evidenceScore).toBe(0.5);
    expect(resultOne.evidenceList[0]).toEqual({ type: 'image', label: '2 photos', weight: 0.5 });

    const resultTwo = highLevelPlan({ task: 'identify', imageUrls: ['p1.png', 'p2.png', 'p3.png'] });
    expect(resultTwo.evidenceScore).toBe(0.5);
    expect(resultTwo.evidenceList[0]).toEqual({ type: 'image', label: '3 photos', weight: 0.5 });
  });

  it('should handle locality context and format coordinates', () => {
    const locality = { lat: 45.12345, lng: -85.67891 };
    const result = highLevelPlan({ task: 'identify', locality });
    expect(result.evidenceScore).toBe(0.2);
    expect(result.evidenceList).toEqual([
      { type: 'locality', label: 'Location: 45.123, -85.679', weight: 0.2 }
    ]);
    expect(result.hints).not.toContain('Share your location for geological context');
    // If task is identify and imageUrls.length === 0, needsMoreEvidence is true regardless of locality
    expect(result.needsMoreEvidence).toBe(true);
  });

  it('should handle observed features and cap score at 0.3', () => {
    const features = [
      { feature: 'color', value: 'red' },
      { feature: 'luster', value: 'metallic' }
    ];
    const result = highLevelPlan({ task: 'identify', features });
    expect(result.evidenceScore).toBe(0.1); // 2 * 0.05
    expect(result.evidenceList).toEqual([
      { type: 'feature', label: '2 observed features', weight: 0.3 }
    ]);

    const genericFeatures = Array(10).fill({ feature: 'prop', value: 'val' });
    const cappedResult = highLevelPlan({ task: 'identify', features: genericFeatures });
    expect(cappedResult.evidenceScore).toBe(0.3); // max capped at 0.3
    expect(cappedResult.evidenceList[0].label).toBe('10 observed features');
  });

  it('should combine multiple inputs correctly', () => {
    const locality = { lat: 45, lng: -85 };
    const features = [{ feature: 'color', value: 'green' }];
    const imageUrls = ['p1.png', 'p2.png'];
    const result = highLevelPlan({ task: 'identify', imageUrls, locality, features });

    // photos (0.5) + locality (0.2) + 1 feature (0.05) = 0.75
    expect(result.evidenceScore).toBe(0.75);
    expect(result.evidenceList).toHaveLength(3);
    expect(result.hints).toEqual([]); // no hints left to show
    expect(result.needsMoreEvidence).toBe(false);
  });

  it('should handle isOffline fallback flag', () => {
    const result = highLevelPlan({ task: 'identify', isOffline: true });
    expect(result.isOffline).toBe(true);
  });

  it('should require photos for identify task to clear needsMoreEvidence', () => {
    const locality = { lat: 45, lng: -85 };
    const features = Array(10).fill({ feature: 'prop', value: 'val' });

    // evidenceScore is locality (0.2) + features (0.3) = 0.5 (>= 0.2)
    // but task is identify and imageUrls is empty, so needsMoreEvidence is true
    const resultIdentify = highLevelPlan({ task: 'identify', locality, features });
    expect(resultIdentify.needsMoreEvidence).toBe(true);

    // with other tasks, empty imageUrls is allowed if evidenceScore >= 0.2
    const resultFieldNote = highLevelPlan({ task: 'field_note', locality, features });
    expect(resultFieldNote.needsMoreEvidence).toBe(false);
  });
});

describe('scoreToBand', () => {
  it('should return correct bands based on scores', () => {
    expect(scoreToBand(0.8)).toBe('high');
    expect(scoreToBand(0.75)).toBe('high');
    expect(scoreToBand(0.74)).toBe('medium');
    expect(scoreToBand(0.45)).toBe('medium');
    expect(scoreToBand(0.44)).toBe('low');
    expect(scoreToBand(0)).toBe('low');
  });
});

describe('bandLabel', () => {
  it('should map band names to label strings', () => {
    expect(bandLabel('high')).toBe('High confidence');
    expect(bandLabel('medium')).toBe('Moderate confidence');
    expect(bandLabel('low')).toBe('Low confidence');
  });
});

describe('shouldHalt', () => {
  it('should halt if needsMoreEvidence is true', () => {
    const result = shouldHalt({ evidenceScore: 0.8, needsMoreEvidence: true, isOffline: false });
    expect(result).toEqual({ halt: true, reason: 'insufficient_evidence' });
  });

  it('should halt if isOffline is true', () => {
    const result = shouldHalt({ evidenceScore: 0.8, needsMoreEvidence: false, isOffline: true });
    expect(result).toEqual({ halt: true, reason: 'offline' });
  });

  it('should halt if combined confidence is sufficient (>= 0.7)', () => {
    // combined = evidenceScore * 0.4 + modelConfidence * 0.6
    // 0.8 * 0.4 + 0.7 * 0.6 = 0.32 + 0.42 = 0.74 >= 0.7
    const result = shouldHalt({ evidenceScore: 0.8, modelConfidence: 0.7, needsMoreEvidence: false, isOffline: false });
    expect(result).toEqual({ halt: true, reason: 'sufficient_confidence' });
  });

  it('should not halt if combined confidence is insufficient (< 0.7)', () => {
    // 0.5 * 0.4 + 0.6 * 0.6 = 0.20 + 0.36 = 0.56 < 0.7
    const result = shouldHalt({ evidenceScore: 0.5, modelConfidence: 0.6, needsMoreEvidence: false, isOffline: false });
    expect(result).toEqual({ halt: false, reason: null });
  });
});

describe('recommendAction', () => {
  it('should return rescan if offline, needs more evidence, or band is low', () => {
    expect(recommendAction({ isOffline: true })).toBe('rescan');
    expect(recommendAction({ needsMoreEvidence: true })).toBe('rescan');
    expect(recommendAction({ band: 'low' })).toBe('rescan');
  });

  it('should return compare if band is medium', () => {
    expect(recommendAction({ band: 'medium', task: 'identify', isOffline: false, needsMoreEvidence: false })).toBe('compare');
  });

  it('should handle high/other bands based on task type', () => {
    expect(recommendAction({ band: 'high', task: 'identify' })).toBe('save');
    expect(recommendAction({ band: 'high', task: 'value_estimate' })).toBe('list');
    expect(recommendAction({ band: 'high', task: 'field_note' })).toBe('save');
  });
});
