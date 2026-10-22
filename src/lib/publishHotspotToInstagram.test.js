import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('npm:@base44/sdk@0.8.44', () => ({
  createClientFromRequest: vi.fn(),
}));

vi.mock('base44:runtime', () => ({
  secrets: {
    get: vi.fn().mockReturnValue(null),
  },
}));

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import handler from '../../base44/functions/publishHotspotToInstagram/entry.ts';

describe('publishHotspotToInstagram error sanitization', () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it('sanitizes Instagram account resolution failure without leaking third-party detail payload', async () => {
    const mockBase44 = {
      auth: {
        me: vi.fn().mockResolvedValue({ id: 'user_1', role: 'admin' }),
      },
      asServiceRole: {
        entities: {
          Hotspot: {
            get: vi.fn().mockResolvedValue({
              id: 'hotspot_1',
              name: 'Agate Beach',
              image_url: 'https://base44.app/photos/agate.jpg',
            }),
          },
        },
        connectors: {
          getConnection: vi.fn().mockResolvedValue({ accessToken: 'secret_token_123' }),
        },
      },
    };
    createClientFromRequest.mockReturnValue(mockBase44);

    const sensitiveErrorPayload = {
      error: {
        message: 'Invalid OAuth access token.',
        type: 'OAuthException',
        code: 190,
        fbtrace_id: 'A1B2C3D4E5',
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(sensitiveErrorPayload),
    });

    const consoleErrorSpy = vi.fn();
    console.error = consoleErrorSpy;

    const req = new Request('https://app.test/api/publishHotspotToInstagram', {
      method: 'POST',
      body: JSON.stringify({ hotspot_id: 'hotspot_1' }),
    });

    const res = await handler(req);
    expect(res.status).toBe(502);

    const data = await res.json();
    expect(data.error).toBe('Could not resolve Instagram account');
    expect(data.detail).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain('A1B2C3D4E5');
    expect(JSON.stringify(data)).not.toContain('OAuthException');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Instagram account resolution failed:',
      sensitiveErrorPayload
    );
  });
});
