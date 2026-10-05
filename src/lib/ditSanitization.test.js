import { describe, it, expect, vi } from 'vitest';
import { handleDitChatRequest } from '../../base44/functions/ditChat/entry.ts';
import { handleDitClassifyRequest } from '../../base44/functions/ditClassify/entry.ts';

describe('ditChat error sanitization', () => {
  const createChatReq = () =>
    new Request('https://example.com/api/ditChat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });

  it('returns 401 when unauthorized', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => null },
    });
    const res = await handleDitChatRequest(createChatReq(), {
      createClientFromRequest: mockClientFactory,
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('sanitizes missing API key error', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'explorer@example.com' }) },
    });
    const res = await handleDitChatRequest(createChatReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: () => undefined,
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Service configuration error' });
    expect(body.error).not.toContain('All_in_1_KEY');
  });

  it('sanitizes upstream API error without leaking details object', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'explorer@example.com' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const sensitiveData = {
      error: { message: 'Internal upstream trace ID: 0x99238', code: 'SECRET_CODE' },
      internal_host: 'private-node.dit.internal',
    };

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sensitiveData), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await handleDitChatRequest(createChatReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: (k) => (k === 'All_in_1_KEY' ? 'test-key' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: 'DIT request failed' });
    expect(body.details).toBeUndefined();
    expect(body.error).not.toContain('private-node');
    expect(spyConsole).toHaveBeenCalledWith('DIT Chat request failed:', 502, sensitiveData);

    spyConsole.mockRestore();
  });

  it('sanitizes caught exceptions without leaking internal stack or message', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'explorer@example.com' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFetch = vi.fn().mockRejectedValue(new Error('DNS resolution failed for internal endpoint'));

    const res = await handleDitChatRequest(createChatReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: (k) => (k === 'All_in_1_KEY' ? 'test-key' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Internal server error' });
    expect(body.error).not.toContain('DNS resolution failed');
    expect(spyConsole).toHaveBeenCalledWith('ditChat error:', expect.any(Error));

    spyConsole.mockRestore();
  });
});

describe('ditClassify error sanitization', () => {
  const createClassifyReq = () =>
    new Request('https://example.com/api/ditClassify', {
      method: 'POST',
      body: JSON.stringify({ image_url: 'https://base44.app/photos/specimen1.jpg' }),
    });

  it('sanitizes upstream vision API error without leaking details', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'explorer@example.com' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const sensitivePayload = {
      error: { message: 'Upstream Rate Limit Exceeded on node-42' },
      upstream_ip: '10.0.0.42',
    };

    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === 'https://base44.app/photos/specimen1.jpg') {
        return Promise.resolve(
          new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify(sensitivePayload), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    const res = await handleDitClassifyRequest(createClassifyReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: (k) => (k === 'All_in_1_KEY' ? 'test-key' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ error: 'DIT vision request failed' });
    expect(body.details).toBeUndefined();
    expect(spyConsole).toHaveBeenCalledWith('DIT Vision request failed:', 429, sensitivePayload);

    spyConsole.mockRestore();
  });

  it('sanitizes non-JSON model responses without leaking raw string payload', async () => {
    const mockClientFactory = () => ({
      auth: { me: async () => ({ email: 'explorer@example.com' }) },
    });
    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const rawModelOutput = 'Malformed response <script>alert("xss")</script> internal trace dump';

    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === 'https://base44.app/photos/specimen1.jpg') {
        return Promise.resolve(
          new Response('fake-image-bytes', {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: rawModelOutput }] } }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    });

    const res = await handleDitClassifyRequest(createClassifyReq(), {
      createClientFromRequest: mockClientFactory,
      envGet: (k) => (k === 'All_in_1_KEY' ? 'test-key' : undefined),
      fetchImpl: mockFetch,
    });

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: 'Invalid response from model' });
    expect(body.raw).toBeUndefined();
    expect(spyConsole).toHaveBeenCalledWith('ditClassify model returned non-JSON:', rawModelOutput);

    spyConsole.mockRestore();
  });
});
