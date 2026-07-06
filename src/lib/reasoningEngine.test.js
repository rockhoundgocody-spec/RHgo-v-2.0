/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { scoreToBand } from './reasoningEngine';

describe('scoreToBand', () => {
  it.each([
    { score: 0.8, expected: 'high' },
    { score: 0.75, expected: 'high' },
    { score: 0.74, expected: 'medium' },
    { score: 0.5, expected: 'medium' },
    { score: 0.45, expected: 'medium' },
    { score: 0.44, expected: 'low' },
    { score: 0.1, expected: 'low' },
    { score: 0, expected: 'low' },
    { score: 1.0, expected: 'high' },
    { score: -1, expected: 'low' },
    { score: 2, expected: 'high' },
  ])('should return "$expected" for score $score', ({ score, expected }) => {
    expect(scoreToBand(score)).toBe(expected);
  });
});
