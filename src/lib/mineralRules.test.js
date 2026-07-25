import { describe, it, expect } from 'vitest';
import { shouldHalt } from './mineralRules.js';

describe('shouldHalt', () => {
  it('should return true if final_score is >= 0.82', () => {
    const result = {
      final_score: 0.85,
      unfired_rules: [{ rule_id: 'R001' }] // High weight rule R001 (0.12) is unfired
    };
    expect(shouldHalt(result)).toBe(true);
  });

  it('should return true if final_score is exactly 0.82', () => {
    const result = {
      final_score: 0.82,
      unfired_rules: [{ rule_id: 'R001' }]
    };
    expect(shouldHalt(result)).toBe(true);
  });

  it('should return true if no high-weight rules remain unfired', () => {
    const result = {
      final_score: 0.5,
      unfired_rules: [
        { rule_id: 'R003' }, // Weight 0.10 (low)
        { rule_id: 'R012' }  // Weight 0.04 (low)
      ]
    };
    expect(shouldHalt(result)).toBe(true);
  });

  it('should return false if final_score < 0.82 and high-weight rules remain unfired', () => {
    const result = {
      final_score: 0.7,
      unfired_rules: [
        { rule_id: 'R001' }, // Weight 0.12 (high)
        { rule_id: 'R004' }  // Weight 0.18 (high)
      ]
    };
    expect(shouldHalt(result)).toBe(false);
  });

  it('should return false if final_score < 0.82 and exactly one high-weight rule (threshold 0.12) remains', () => {
    const result = {
      final_score: 0.81,
      unfired_rules: [
        { rule_id: 'R001' } // Weight 0.12 (high)
      ]
    };
    expect(shouldHalt(result)).toBe(false);
  });

  it('should return true if only low-weight rules (< 0.12) remain unfired', () => {
    const result = {
      final_score: 0.6,
      unfired_rules: [
        { rule_id: 'R002' }, // Wait, R002 is 0.15. Let's use R003 (0.10)
        { rule_id: 'R003' }
      ]
    };
    // Re-check R002 weight in mineralRules.js... it's 0.15.
    // Let's use R008 (0.05) and R010 (0.06)
    const result2 = {
      final_score: 0.6,
      unfired_rules: [
        { rule_id: 'R008' },
        { rule_id: 'R010' }
      ]
    };
    expect(shouldHalt(result2)).toBe(true);
  });

  it('should handle empty unfired_rules correctly', () => {
    const result = {
      final_score: 0.1,
      unfired_rules: []
    };
    expect(shouldHalt(result)).toBe(true);
  });
});
