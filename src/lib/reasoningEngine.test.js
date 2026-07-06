import { describe, it, expect, vi } from 'vitest';
import { reason } from './reasoningEngine';
import { base44 } from '@/api/base44Client';

// Mock the base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        InvokeLLM: vi.fn(),
      },
    },
  },
}));

describe('reasoningEngine', () => {
  it('should handle offline fallback when isOffline is true (pre-LLM halt)', async () => {
    const ctx = {
      task: 'identify',
      isOffline: true,
      imageUrls: ['http://example.com/image.jpg'], // Provide an image to avoid insufficient_evidence halt
    };

    const result = await reason(ctx);

    expect(result.isOfflineFallback).toBe(true);
    expect(result.reasoningSummary).toContain('You are offline');
    expect(result.primaryResult).toBe('Unknown specimen');
    expect(base44.integrations.Core.InvokeLLM).not.toHaveBeenCalled();
  });

  it('should handle insufficient evidence halt', async () => {
    const ctx = {
      task: 'identify',
      isOffline: false,
      imageUrls: [], // No images for identify task should trigger insufficient evidence
    };

    const result = await reason(ctx);

    expect(result.needsMoreEvidence).toBe(true);
    expect(result.reasoningSummary).toContain('More evidence is needed');
    expect(result.primaryResult).toBe('Unknown specimen');
    expect(base44.integrations.Core.InvokeLLM).not.toHaveBeenCalled();
  });

  it('should handle offline fallback when LLM execution fails (post-LLM halt)', async () => {
    const ctx = {
      task: 'identify',
      isOffline: false,
      imageUrls: ['http://example.com/image.jpg'],
    };

    // Simulate API failure
    vi.mocked(base44.integrations.Core.InvokeLLM).mockRejectedValue(new Error('Network Error'));

    const result = await reason(ctx);

    expect(result.isOfflineFallback).toBe(true);
    expect(result.reasoningSummary).toContain('service is currently unavailable');
    expect(result.primaryResult).toBe('Identification unavailable');
    expect(result.confidenceBand).toBe('low');
  });

  it('should complete identification when everything is okay', async () => {
    const ctx = {
      task: 'identify',
      isOffline: false,
      imageUrls: ['http://example.com/image.jpg'],
      locality: { lat: 45, lng: -90 },
    };

    const mockResponse = {
      primary_result: 'Quartz',
      confidence: 0.9,
      reasoning: 'Clear hexagonal crystals observed.',
      observed_features: [{ feature: 'crystal habit', value: 'hexagonal' }],
      uncertainty: [],
      rarity: 'common',
    };

    vi.mocked(base44.integrations.Core.InvokeLLM).mockResolvedValue(mockResponse);

    const result = await reason(ctx);

    expect(result.isOfflineFallback).toBe(false);
    expect(result.primaryResult).toBe('Quartz');
    expect(result.confidenceBand).toBe('high');
    expect(result.reasoningSummary).toBe('Clear hexagonal crystals observed.');
    expect(base44.integrations.Core.InvokeLLM).toHaveBeenCalled();
  });
});
