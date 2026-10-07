import { describe, it, expect, vi } from 'vitest';
import { handleRunDeepAnalysisRequest } from '../../base44/functions/runDeepAnalysis/entry.ts';

describe('handleRunDeepAnalysisRequest', () => {
  const dummyReq = new Request('https://example.com/api/runDeepAnalysis', {
    method: 'POST',
    body: JSON.stringify({
      image_url: 'https://base44.app/storage/specimen.jpg',
      quick_result: { top_match: 'Quartz' },
      lat: 37.7749,
      lng: -122.4194,
    }),
  });

  it('returns 401 when user is unauthenticated', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => null },
    });

    const res = await handleRunDeepAnalysisRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when image_url is not from a trusted storage domain', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'test@example.com' }) },
    });

    const invalidReq = new Request('https://example.com/api/runDeepAnalysis', {
      method: 'POST',
      body: JSON.stringify({
        image_url: 'https://untrusted-malicious-domain.com/evil.jpg',
      }),
    });

    const res = await handleRunDeepAnalysisRequest(invalidReq, {
      createClientFromRequest: mockClientFactory,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'image_url must be from a trusted storage domain' });
  });

  it('sanitizes unexpected exceptions without leaking error details or stack trace', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'test@example.com' }) },
      integrations: {
        Core: {
          InvokeLLM: vi.fn().mockRejectedValue(new Error('Sensitive DB connection timeout at /var/internal/db.sqlite')),
        },
      },
    });

    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handleRunDeepAnalysisRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Internal server error' });
    expect(body.error).not.toContain('Sensitive DB');
    expect(spyConsole).toHaveBeenCalled();

    spyConsole.mockRestore();
  });

  it('returns deep analysis response on successful execution', async () => {
    const mockAnalysis = {
      final_id: 'Quartz (Smoky)',
      confidence: 0.95,
      locality_plausibility: 0.9,
      reasoning: 'Visual characteristics match hexagonal prism structure.',
    };

    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'test@example.com' }) },
      integrations: {
        Core: {
          InvokeLLM: vi.fn().mockResolvedValue(mockAnalysis),
        },
      },
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: { data: [{ name: 'Franciscan Complex', age_text: 'Cretaceous' }] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await handleRunDeepAnalysisRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ deep_analysis: mockAnalysis });
  });
});
