import { describe, it, expect } from 'vitest';

const VALID_REACTIONS = new Set(['fire', 'gem', 'clap', 'wow']);

function isValidReaction(reactionType) {
  return VALID_REACTIONS.has(reactionType);
}

describe('interactPost reaction validation', () => {
  it('should accept valid reaction types', () => {
    expect(isValidReaction('fire')).toBe(true);
    expect(isValidReaction('gem')).toBe(true);
    expect(isValidReaction('clap')).toBe(true);
    expect(isValidReaction('wow')).toBe(true);
  });

  it('should reject invalid reaction types', () => {
    expect(isValidReaction('like')).toBe(false);
    expect(isValidReaction('')).toBe(false);
    expect(isValidReaction(null)).toBe(false);
    expect(isValidReaction(undefined)).toBe(false);
    expect(isValidReaction('FIRE')).toBe(false);
  });
});
