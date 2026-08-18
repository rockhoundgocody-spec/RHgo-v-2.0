import { describe, it, expect, beforeAll } from 'vitest';

// Define window and document globals before importing reasoningEngine to satisfy app-params and base44 client side effects
globalThis.window = {
  location: {
    search: '',
    href: 'http://localhost/',
    pathname: '/',
    hash: '',
  },
  history: {
    replaceState: () => {},
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

globalThis.document = {
  title: '',
};

let scoreToBand;
let bandLabel;

beforeAll(async () => {
  const module = await import('./reasoningEngine.js');
  scoreToBand = module.scoreToBand;
  bandLabel = module.bandLabel;
});

describe('scoreToBand', () => {
  it('returns "high" for scores >= 0.75', () => {
    expect(scoreToBand(0.75)).toBe('high');
    expect(scoreToBand(0.76)).toBe('high');
    expect(scoreToBand(1.0)).toBe('high');
  });

  it('returns "medium" for scores >= 0.45 and < 0.75', () => {
    expect(scoreToBand(0.45)).toBe('medium');
    expect(scoreToBand(0.46)).toBe('medium');
    expect(scoreToBand(0.74)).toBe('medium');
    expect(scoreToBand(0.7499)).toBe('medium');
  });

  it('returns "low" for scores < 0.45', () => {
    expect(scoreToBand(0.44)).toBe('low');
    expect(scoreToBand(0.4499)).toBe('low');
    expect(scoreToBand(0.0)).toBe('low');
    expect(scoreToBand(-0.5)).toBe('low');
  });
});

describe('bandLabel', () => {
  it('returns correct label for valid bands', () => {
    expect(bandLabel('high')).toBe('High confidence');
    expect(bandLabel('medium')).toBe('Moderate confidence');
    expect(bandLabel('low')).toBe('Low confidence');
  });

  it('returns undefined for unknown or invalid bands', () => {
    expect(bandLabel('unknown')).toBeUndefined();
    expect(bandLabel('')).toBeUndefined();
    expect(bandLabel(undefined)).toBeUndefined();
  });
});
