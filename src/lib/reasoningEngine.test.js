/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { shouldHalt } from './reasoningEngine';

describe('shouldHalt', () => {
  it('should halt if more evidence is needed', () => {
    const result = shouldHalt({ needsMoreEvidence: true });
    expect(result).toEqual({ halt: true, reason: 'insufficient_evidence' });
  });

  it('should halt if offline', () => {
    const result = shouldHalt({ needsMoreEvidence: false, isOffline: true });
    expect(result).toEqual({ halt: true, reason: 'offline' });
  });

  it('should prioritize needsMoreEvidence over isOffline', () => {
    const result = shouldHalt({ needsMoreEvidence: true, isOffline: true });
    expect(result).toEqual({ halt: true, reason: 'insufficient_evidence' });
  });

  it('should halt if combined confidence is high enough (>= 0.7)', () => {
    // 0.5 * 0.4 + 0.9 * 0.6 = 0.2 + 0.54 = 0.74
    const result = shouldHalt({
      evidenceScore: 0.5,
      modelConfidence: 0.9,
      needsMoreEvidence: false,
      isOffline: false
    });
    expect(result).toEqual({ halt: true, reason: 'sufficient_confidence' });
  });

  it('should halt if combined confidence is exactly 0.7', () => {
    // 0.4 * 0.4 + 0.9 * 0.6 = 0.16 + 0.54 = 0.7
    const result = shouldHalt({
      evidenceScore: 0.4,
      modelConfidence: 0.9,
      needsMoreEvidence: false,
      isOffline: false
    });
    expect(result).toEqual({ halt: true, reason: 'sufficient_confidence' });
  });

  it('should not halt if combined confidence is below 0.7', () => {
    // 0.4 * 0.4 + 0.8 * 0.6 = 0.16 + 0.48 = 0.64
    const result = shouldHalt({
      evidenceScore: 0.4,
      modelConfidence: 0.8,
      needsMoreEvidence: false,
      isOffline: false
    });
    expect(result).toEqual({ halt: false, reason: null });
  });

  it('should handle missing modelConfidence as 0', () => {
    // 0.5 * 0.4 + 0 * 0.6 = 0.2
    const result = shouldHalt({
      evidenceScore: 0.5,
      needsMoreEvidence: false,
      isOffline: false
    });
    expect(result).toEqual({ halt: false, reason: null });
  });

  it('should halt with high evidenceScore even if modelConfidence is 0', () => {
    // 1.0 * 0.4 + 0.5 * 0.6 = 0.4 + 0.3 = 0.7
    const result = shouldHalt({
      evidenceScore: 1.0,
      modelConfidence: 0.5,
      needsMoreEvidence: false,
      isOffline: false
    });
    expect(result).toEqual({ halt: true, reason: 'sufficient_confidence' });
  });

  it('should not halt if all inputs are zero', () => {
    const result = shouldHalt({
      evidenceScore: 0,
      modelConfidence: 0,
      needsMoreEvidence: false,
      isOffline: false
    });
    expect(result).toEqual({ halt: false, reason: null });
  });

  it('should handle undefined evidenceScore by returning no halt', () => {
    const result = shouldHalt({
      modelConfidence: 1.0,
      needsMoreEvidence: false,
      isOffline: false
    });
    // undefined * 0.4 + 1.0 * 0.6 = NaN + 0.6 = NaN
    // NaN >= 0.7 is false
    expect(result).toEqual({ halt: false, reason: null });
  });
});
