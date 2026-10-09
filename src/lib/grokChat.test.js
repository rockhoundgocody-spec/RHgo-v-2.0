import { describe, it, expect, vi } from 'vitest';
import { handleGrokChatRequest } from '../../base44/functions/grokChat/entry.ts';

describe('handleGrokChatRequest', () => {
  const createReq = () =>
    new Request('https://example.com/api/grokChat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [{ role: 'user', content: 'Hello Clover' }] }),
    });

  it('returns 401 when user is unauthorized', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => null },
    });

    const res = await handleGrokChatRequest(createReq(), {
      createClientFromRequest: mockClientFactory,
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('sanitizes missing API key error without leaking env var names', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ full_name: 'Alex Rover' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handleGrokChatRequest(createReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: () => undefined,
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Service configuration error' });
    expect(body.error).not.toContain('XAI_API_KEY');
    expect(spyConsole).toHaveBeenCalledWith('XAI_API_KEY not configured');

    spyConsole.mockRestore();
  });

  it('sanitizes non-OK upstream error response without leaking upstream error text', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ full_name: 'Alex Rover' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFetch = vi.fn().mockResolvedValue(
      new Response('Secret upstream error: invalid_key_abc', { status: 403 })
    );

    const res = await handleGrokChatRequest(createReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: (key) => (key === 'XAI_API_KEY' ? 'secret-key-123' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'Grok chat request failed' });
    expect(body.error).not.toContain('invalid_key_abc');
    expect(spyConsole).toHaveBeenCalledWith(
      'grokChat request failed:',
      403,
      'Secret upstream error: invalid_key_abc'
    );

    spyConsole.mockRestore();
  });

  it('sanitizes unexpected exceptions without leaking exception stack or internal error message', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ full_name: 'Alex Rover' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFetch = vi.fn().mockRejectedValue(new Error('Internal socket failure at 0x9928'));

    const res = await handleGrokChatRequest(createReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: (key) => (key === 'XAI_API_KEY' ? 'secret-key-123' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Internal server error' });
    expect(body.error).not.toContain('Internal socket failure');

    spyConsole.mockRestore();
  });

  it('returns Grok response on success', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ full_name: 'Alex Rover' }) },
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'That is a gorgeous quartz crystal!' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const res = await handleGrokChatRequest(createReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: (key) => (key === 'XAI_API_KEY' ? 'secret-key-123' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      reply: 'That is a gorgeous quartz crystal!',
      model: 'grok-3-mini',
    });
  });
});
