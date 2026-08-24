import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock base44 client prior to importing reasoningEngine
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: vi.fn(),
      },
    },
  },
}));

import { scoreToBand, bandLabel, reason } from './reasoningEngine.js';
import { base44 } from '@/api/base44Client';

describe('reasoningEngine - Band Helpers', () => {
  describe('scoreToBand', () => {
    it('returns "high" for scores >= 0.75', () => {
      expect(scoreToBand(0.75)).toBe('high');
      expect(scoreToBand(0.85)).toBe('high');
      expect(scoreToBand(1.0)).toBe('high');
    });

    it('returns "medium" for scores >= 0.45 and < 0.75', () => {
      expect(scoreToBand(0.45)).toBe('medium');
      expect(scoreToBand(0.60)).toBe('medium');
      expect(scoreToBand(0.749)).toBe('medium');
    });

    it('returns "low" for scores < 0.45', () => {
      expect(scoreToBand(0.449)).toBe('low');
      expect(scoreToBand(0.20)).toBe('low');
      expect(scoreToBand(0)).toBe('low');
      expect(scoreToBand(-0.1)).toBe('low');
    });
  });

  describe('bandLabel', () => {
    it('returns correct label mapping for high, medium, and low bands', () => {
      expect(bandLabel('high')).toBe('High confidence');
      expect(bandLabel('medium')).toBe('Moderate confidence');
      expect(bandLabel('low')).toBe('Low confidence');
    });

    it('returns undefined for invalid or missing bands', () => {
      expect(bandLabel('unknown')).toBeUndefined();
      expect(bandLabel(null)).toBeUndefined();
    });
  });
});

describe('reasoningEngine - reason() workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pre-halts with insufficient_evidence when task is "identify" and no images are provided', async () => {
    const result = await reason({
      task: 'identify',
      imageUrls: [],
    });

    expect(result.confidenceBand).toBe('low');
    expect(result.needsMoreEvidence).toBe(true);
    expect(result.primaryResult).toBe('Unknown specimen');
    expect(result.recommendedAction).toBe('rescan');
    expect(result.uncertainties).toContain('Not enough evidence to identify');
    expect(base44.integrations.Core.InvokeLLM).not.toHaveBeenCalled();
  });

  it('pre-halts when offline is true', async () => {
    const result = await reason({
      task: 'identify',
      imageUrls: ['http://example.com/mineral.jpg'],
      isOffline: true,
    });

    expect(result.isOfflineFallback).toBe(true);
    expect(result.confidenceBand).toBe('low');
    expect(result.recommendedAction).toBe('rescan');
    expect(result.reasoningSummary).toContain('You are offline');
    expect(base44.integrations.Core.InvokeLLM).not.toHaveBeenCalled();
  });

  it('executes LLM call and builds high confidence result when evidence and model confidence are high', async () => {
    const mockLLMResponse = {
      primary_result: 'Amethyst',
      confidence: 0.9,
      reasoning: 'Distinctive purple quartz crystal habit',
      observed_features: [{ feature: 'Color', value: 'Purple' }],
      uncertainty: [],
    };

    base44.integrations.Core.InvokeLLM.mockResolvedValueOnce(mockLLMResponse);

    const result = await reason({
      task: 'identify',
      imageUrls: ['http://example.com/photo1.jpg', 'http://example.com/photo2.jpg'],
      locality: { lat: 45.123, lng: -88.456 },
      features: [{ feature: 'Luster', value: 'Vitreous' }],
    });

    // plan.evidenceScore = min(2*0.25, 0.5) [0.5] + 0.2 (locality) + min(1*0.05, 0.3) [0.05] = 0.75
    // combinedScore = 0.75 * 0.3 + 0.9 * 0.7 = 0.225 + 0.63 = 0.855 >= 0.75 => high
    expect(result.confidenceBand).toBe('high');
    expect(result.primaryResult).toBe('Amethyst');
    expect(result.recommendedAction).toBe('save');
    expect(result.needsMoreEvidence).toBe(false);
    expect(result.isOfflineFallback).toBe(false);
    expect(base44.integrations.Core.InvokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini_3_flash',
        file_urls: ['http://example.com/photo1.jpg', 'http://example.com/photo2.jpg'],
      })
    );
  });

  it('handles LLM network/API failure with offline fallback object', async () => {
    base44.integrations.Core.InvokeLLM.mockRejectedValueOnce(new Error('Network error'));

    const result = await reason({
      task: 'identify',
      imageUrls: ['http://example.com/rock.jpg'],
    });

    expect(result.primaryResult).toBe('Identification unavailable');
    expect(result.confidenceBand).toBe('low');
    expect(result.confidenceScore).toBe(0);
    expect(result.isOfflineFallback).toBe(true);
    expect(result.uncertainties).toContain('AI service unreachable');
    expect(result.recommendedAction).toBe('rescan');
  });

  it('maps medium confidence score to "compare" recommendedAction for identify task', async () => {
    // Force combined score into medium band [0.45, 0.75)
    // evidenceScore: 1 photo (0.25) -> combined = 0.25 * 0.3 + 0.5 * 0.7 = 0.075 + 0.35 = 0.425 (low)
    // Let's add locality: evidenceScore = 0.25 + 0.2 = 0.45.
    // combinedScore = 0.45 * 0.3 + 0.5 * 0.7 = 0.135 + 0.35 = 0.485 (medium)
    const mockLLMResponse = {
      primary_result: 'Quartz',
      confidence: 0.5,
      reasoning: 'Clear crystal structure',
      observed_features: [],
      uncertainty: ['Could be calcite'],
    };

    base44.integrations.Core.InvokeLLM.mockResolvedValueOnce(mockLLMResponse);

    const result = await reason({
      task: 'identify',
      imageUrls: ['http://example.com/rock.jpg'],
      locality: { lat: 40.0, lng: -75.0 },
    });

    expect(result.confidenceBand).toBe('medium');
    expect(result.recommendedAction).toBe('compare');
    expect(result.needsMoreEvidence).toBe(false);
  });
});
