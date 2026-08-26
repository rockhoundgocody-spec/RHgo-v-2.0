import { vi, describe, it, expect, beforeAll, afterEach } from 'vitest';

const { invokeLLM } = vi.hoisted(() => ({ invokeLLM: vi.fn() }));

vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: invokeLLM,
      },
    },
  },
}));

let scoreToBand;
let bandLabel;
let reason;
let shouldHalt;

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
  reason = mod.reason;
  shouldHalt = mod.shouldHalt;
});

afterEach(() => {
  invokeLLM.mockReset();
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

describe('reason fallback behavior', () => {
  it('halts before the remote model when the client is offline', async () => {
    const result = await reason({
      task: 'identify',
      isOffline: true,
      imageUrls: ['https://example.test/specimen.jpg'],
    });

    expect(result).toMatchObject({
      primaryResult: 'Unknown specimen',
      confidenceBand: 'low',
      isOfflineFallback: true,
    });
    expect(result.reasoningSummary).toContain('offline');
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it('halts on insufficient evidence without spending a model request', async () => {
    const result = await reason({ task: 'identify', imageUrls: [] });

    expect(result).toMatchObject({
      primaryResult: 'Unknown specimen',
      needsMoreEvidence: true,
      isOfflineFallback: false,
    });
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it('returns a safe fallback when the model request fails', async () => {
    invokeLLM.mockRejectedValueOnce(new Error('network unavailable'));

    const result = await reason({
      task: 'identify',
      imageUrls: ['https://example.test/specimen.jpg'],
    });

    expect(result).toMatchObject({
      primaryResult: 'Identification unavailable',
      confidenceBand: 'low',
      confidenceScore: 0,
      isOfflineFallback: true,
    });
    expect(result.reasoningSummary).toContain('unavailable');
  });

  it('preserves a successful model result and confidence band', async () => {
    invokeLLM.mockResolvedValueOnce({
      primary_result: 'Quartz',
      confidence: 0.9,
      reasoning: 'Hexagonal crystal habit is visible.',
      observed_features: [{ feature: 'habit', value: 'hexagonal' }],
      uncertainty: [],
    });

    const result = await reason({
      task: 'identify',
      imageUrls: ['https://example.test/specimen.jpg'],
      locality: { lat: 45, lng: -90 },
    });

    expect(result).toMatchObject({
      primaryResult: 'Quartz',
      confidenceBand: 'high',
      isOfflineFallback: false,
      reasoningSummary: 'Hexagonal crystal habit is visible.',
    });
    expect(result.evidenceUsed).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'feature', label: 'habit', value: 'hexagonal' }),
    ]));
  });
});

describe('shouldHalt', () => {
  it('prioritizes insufficient evidence over offline state', () => {
    expect(shouldHalt({ needsMoreEvidence: true, isOffline: true }))
      .toEqual({ halt: true, reason: 'insufficient_evidence' });
  });

  it('halts offline work before confidence evaluation', () => {
    expect(shouldHalt({ needsMoreEvidence: false, isOffline: true, evidenceScore: 1, modelConfidence: 1 }))
      .toEqual({ halt: true, reason: 'offline' });
  });

  it('halts at the exact combined-confidence threshold', () => {
    expect(shouldHalt({
      evidenceScore: 0.4,
      modelConfidence: 0.9,
      needsMoreEvidence: false,
      isOffline: false,
    })).toEqual({ halt: true, reason: 'sufficient_confidence' });
  });

  it('continues immediately below the combined-confidence threshold', () => {
    expect(shouldHalt({
      evidenceScore: 0.4,
      modelConfidence: 0.899,
      needsMoreEvidence: false,
      isOffline: false,
    })).toEqual({ halt: false, reason: null });
  });

  it('treats missing, non-finite, and negative confidence as zero', () => {
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(shouldHalt({
        evidenceScore: value,
        modelConfidence: value,
        needsMoreEvidence: false,
        isOffline: false,
      })).toEqual({ halt: false, reason: null });
    }
  });

  it('clamps oversized finite confidence values to calibrated unit scores', () => {
    expect(shouldHalt({
      evidenceScore: 5,
      modelConfidence: 5,
      needsMoreEvidence: false,
      isOffline: false,
    })).toEqual({ halt: true, reason: 'sufficient_confidence' });
  });
});
