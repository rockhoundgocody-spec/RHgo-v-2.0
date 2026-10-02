import { describe, it, expect, vi } from 'vitest';
import { handleXaiVoiceTokenRequest } from '../../base44/functions/xaiVoiceToken/entry.ts';

describe('handleXaiVoiceTokenRequest', () => {
  const dummyReq = new Request('https://example.com/api/xaiVoiceToken', { method: 'POST' });

  it('returns 401 when user is unauthorized', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => null },
    });

    const res = await handleXaiVoiceTokenRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('sanitizes missing API key error without leaking env var names', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'test@example.com' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handleXaiVoiceTokenRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
      envGet: () => undefined,
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Voice service configuration error' });
    expect(body.error).not.toContain('XAI_API_KEY');
    expect(spyConsole).toHaveBeenCalledWith('XAI_API_KEY not configured');

    spyConsole.mockRestore();
  });

  it('sanitizes non-OK upstream error response without leaking upstream payload', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'test@example.com' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFetch = vi.fn().mockResolvedValue(
      new Response('Secret internal error: invalid_token_xyz', { status: 403 })
    );

    const res = await handleXaiVoiceTokenRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
      envGet: (key) => (key === 'XAI_API_KEY' ? 'secret-key-123' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to mint voice session token' });
    expect(body.error).not.toContain('invalid_token_xyz');
    expect(spyConsole).toHaveBeenCalledWith(
      'xAI Voice Token request failed:',
      403,
      'Secret internal error: invalid_token_xyz'
    );

    spyConsole.mockRestore();
  });

  it('sanitizes unexpected exceptions without leaking exception stack/message', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'test@example.com' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFetch = vi.fn().mockRejectedValue(new Error('Network socket dump at 0x8849'));

    const res = await handleXaiVoiceTokenRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
      envGet: (key) => (key === 'XAI_API_KEY' ? 'secret-key-123' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Internal server error' });
    expect(body.error).not.toContain('Network socket dump');

    spyConsole.mockRestore();
  });

  it('returns session token and expiration on success', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'test@example.com' }) },
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ value: 'xai_sess_tok_99', expires_at: 1700000000 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await handleXaiVoiceTokenRequest(dummyReq, {
      createClientFromRequest: mockClientFactory,
      envGet: (key) => (key === 'XAI_API_KEY' ? 'secret-key-123' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ token: 'xai_sess_tok_99', expires_at: 1700000000 });
  });
});
