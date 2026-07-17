import { describe, it, expect } from 'vitest';
import { calculateCredibilityScore } from './specimenOptimization.js';

describe('calculateCredibilityScore', () => {
  it('should return 0 for a minimum default specimen with no reasoning history', () => {
    const specimen = {};
    const score = calculateCredibilityScore(specimen);
    expect(score).toBe(0);
  });

  it('should calculate score based on AI confidence correctly', () => {
    // Confidence baseline (specimen.ai_confidence * 30)
    // 0.5 * 30 = 15
    expect(calculateCredibilityScore({ ai_confidence: 0.5 })).toBe(15);
    // 1.0 * 30 = 30
    expect(calculateCredibilityScore({ ai_confidence: 1.0 })).toBe(30);
    // 0 * 30 = 0
    expect(calculateCredibilityScore({ ai_confidence: 0 })).toBe(0);
  });

  it('should calculate photo evidence score correctly up to the cap of 25', () => {
    // Math.min(photoCount * 10, 25)
    // 0 photos -> 0
    expect(calculateCredibilityScore({ photo_ids: [] })).toBe(0);
    // 1 photo -> 10
    expect(calculateCredibilityScore({ photo_ids: ['p1'] })).toBe(10);
    // 2 photos -> 20
    expect(calculateCredibilityScore({ photo_ids: ['p1', 'p2'] })).toBe(20);
    // 3 photos -> 25 (capped from 30)
    expect(calculateCredibilityScore({ photo_ids: ['p1', 'p2', 'p3'] })).toBe(25);
    // 10 photos -> 25 (capped)
    expect(calculateCredibilityScore({ photo_ids: Array(10).fill('p') })).toBe(25);
  });

  it('should calculate verification depth score correctly', () => {
    // specimen.verification_count * 5
    expect(calculateCredibilityScore({ verification_count: 0 })).toBe(0);
    expect(calculateCredibilityScore({ verification_count: 1 })).toBe(5);
    expect(calculateCredibilityScore({ verification_count: 4 })).toBe(20);
  });

  it('should calculate reasoning completeness correctly up to the cap of 20', () => {
    // deepReasoning = reasoningHistory.filter(r => r.key_evidence?.length > 2).length
    // score += Math.min(deepReasoning * 8, 20)

    const lowReasoning = [
      { key_evidence: ['a', 'b'] }, // length 2 (not > 2)
      { key_evidence: ['a'] }, // length 1
      {} // missing key_evidence
    ];
    expect(calculateCredibilityScore({}, lowReasoning)).toBe(0);

    const oneDeepReasoning = [
      { key_evidence: ['a', 'b', 'c'] }, // length 3 (> 2)
      { key_evidence: ['a', 'b'] } // length 2
    ];
    expect(calculateCredibilityScore({}, oneDeepReasoning)).toBe(8);

    const twoDeepReasoning = [
      { key_evidence: ['a', 'b', 'c'] }, // length 3 (> 2)
      { key_evidence: ['1', '2', '3', '4'] } // length 4 (> 2)
    ];
    expect(calculateCredibilityScore({}, twoDeepReasoning)).toBe(16);

    const threeDeepReasoning = [
      { key_evidence: ['a', 'b', 'c'] }, // length 3 (> 2)
      { key_evidence: ['1', '2', '3', '4'] }, // length 4 (> 2)
      { key_evidence: ['x', 'y', 'z'] } // length 3 (> 2)
    ];
    // 3 * 8 = 24 -> capped at 20
    expect(calculateCredibilityScore({}, threeDeepReasoning)).toBe(20);
  });

  it('should apply the expert review bonus if verified is true', () => {
    // if (specimen.verified) score += 20;
    expect(calculateCredibilityScore({ verified: true })).toBe(20);
    expect(calculateCredibilityScore({ verified: false })).toBe(0);
    expect(calculateCredibilityScore({ verified: 'yes' })).toBe(20); // truthy check
  });

  it('should cap the final score at 100', () => {
    const perfectSpecimen = {
      ai_confidence: 1.0,        // 30
      photo_ids: ['1', '2', '3'], // 25
      verification_count: 10,     // 50
      verified: true              // 20
    };
    const perfectReasoning = [
      { key_evidence: ['a', 'b', 'c'] },
      { key_evidence: ['d', 'e', 'f'] },
      { key_evidence: ['g', 'h', 'i'] } // 20
    ];
    // Sum = 30 + 25 + 50 + 20 + 20 = 145 -> Capped at 100
    expect(calculateCredibilityScore(perfectSpecimen, perfectReasoning)).toBe(100);
  });

  it('should round the final score to the nearest integer', () => {
    // ai_confidence of 0.55 * 30 = 16.5 -> rounded to 17
    expect(calculateCredibilityScore({ ai_confidence: 0.55 })).toBe(17);

    // ai_confidence of 0.51 * 30 = 15.3 -> rounded to 15
    expect(calculateCredibilityScore({ ai_confidence: 0.51 })).toBe(15);
  });
});
