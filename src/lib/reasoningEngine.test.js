import { describe, it, expect, vi, beforeAll } from 'vitest';

// We also need to mock base44 client since reasoningEngine imports it.
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: vi.fn()
      }
    }
  }
}));
// Try mocking with relative path as well just in case.
vi.mock('../api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: vi.fn()
      }
    }
  }
}));

describe('reasoningEngine bands', () => {
  let scoreToBand;
  let bandLabel;

  beforeAll(async () => {
    // Mock the window object and localStorage for app-params.js before importing anything
    globalThis.window = {
      location: {
        search: '',
        href: '',
        pathname: '',
        hash: '',
      },
      history: {
        replaceState: vi.fn(),
      },
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
    };
    globalThis.document = {
      title: 'Mock Title'
    };
    globalThis.localStorage = globalThis.window.localStorage;
    globalThis.sessionStorage = globalThis.window.sessionStorage;

    // Dynamically import the module after globals are set
    const reasoningEngine = await import('./reasoningEngine.js');
    scoreToBand = reasoningEngine.scoreToBand;
    bandLabel = reasoningEngine.bandLabel;
  });

  describe('scoreToBand', () => {
    it('should return "high" for scores >= 0.75', () => {
      expect(scoreToBand(1.0)).toBe('high');
      expect(scoreToBand(0.8)).toBe('high');
      expect(scoreToBand(0.75)).toBe('high');
    });

    it('should return "medium" for scores >= 0.45 and < 0.75', () => {
      expect(scoreToBand(0.74)).toBe('medium');
      expect(scoreToBand(0.6)).toBe('medium');
      expect(scoreToBand(0.45)).toBe('medium');
    });

    it('should return "low" for scores < 0.45', () => {
      expect(scoreToBand(0.44)).toBe('low');
      expect(scoreToBand(0.2)).toBe('low');
      expect(scoreToBand(0.0)).toBe('low');
      expect(scoreToBand(-0.5)).toBe('low');
    });
  });

  describe('bandLabel', () => {
    it('should return the correct label for "high"', () => {
      expect(bandLabel('high')).toBe('High confidence');
    });

    it('should return the correct label for "medium"', () => {
      expect(bandLabel('medium')).toBe('Moderate confidence');
    });

    it('should return the correct label for "low"', () => {
      expect(bandLabel('low')).toBe('Low confidence');
    });

    it('should return undefined for unknown bands', () => {
      expect(bandLabel('unknown')).toBeUndefined();
      expect(bandLabel(null)).toBeUndefined();
    });
  });
});
