import { vi, describe, it, expect, beforeAll } from 'vitest';

vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: vi.fn(),
      },
    },
  },
}));

let scoreToBand;
let bandLabel;

beforeAll(async () => {
  globalThis.window = {
    self: {},
    top: {},
    location: {
      search: '',
      href: 'http://localhost:3000',
      pathname: '/',
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;

  const mod = await import('./reasoningEngine.js');
  scoreToBand = mod.scoreToBand;
  bandLabel = mod.bandLabel;
});

describe('scoreToBand', () => {
  it('returns "high" for scores greater than or equal to 0.75', () => {
    expect(scoreToBand(0.75)).toBe('high');
    expect(scoreToBand(0.8)).toBe('high');
    expect(scoreToBand(1.0)).toBe('high');
    expect(scoreToBand(1.5)).toBe('high');
  });

  it('returns "medium" for scores between 0.45 (inclusive) and 0.75 (exclusive)', () => {
    expect(scoreToBand(0.45)).toBe('medium');
    expect(scoreToBand(0.5)).toBe('medium');
    expect(scoreToBand(0.749)).toBe('medium');
    expect(scoreToBand(0.74999)).toBe('medium');
  });

  it('returns "low" for scores less than 0.45', () => {
    expect(scoreToBand(0.449)).toBe('low');
    expect(scoreToBand(0.2)).toBe('low');
    expect(scoreToBand(0.0)).toBe('low');
    expect(scoreToBand(-0.5)).toBe('low');
  });
});

describe('bandLabel', () => {
  it('maps "high" to "High confidence"', () => {
    expect(bandLabel('high')).toBe('High confidence');
  });

  it('maps "medium" to "Moderate confidence"', () => {
    expect(bandLabel('medium')).toBe('Moderate confidence');
  });

  it('maps "low" to "Low confidence"', () => {
    expect(bandLabel('low')).toBe('Low confidence');
  });

  it('returns undefined for invalid or unknown bands', () => {
    expect(bandLabel('unknown')).toBeUndefined();
    expect(bandLabel('')).toBeUndefined();
    expect(bandLabel(null)).toBeUndefined();
  });
});
