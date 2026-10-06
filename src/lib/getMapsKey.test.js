import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleGetMapsKeyRequest } from '../../base44/functions/getMapsKey/entry.ts';

describe('handleGetMapsKeyRequest', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns 401 Unauthorized when user is not authenticated', async () => {
    const mockBase44 = {
      auth: {
        me: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
      },
    };

    const req = new Request('http://localhost/api/getMapsKey');
    const res = await handleGetMapsKeyRequest(req, {
      createClientFromRequest: () => mockBase44,
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns google maps key when user is authenticated', async () => {
    const mockBase44 = {
      auth: {
        me: vi.fn().mockResolvedValue({ id: 'user-123', email: 'user@example.com' }),
      },
    };

    const req = new Request('http://localhost/api/getMapsKey');
    const res = await handleGetMapsKeyRequest(req, {
      createClientFromRequest: () => mockBase44,
      envGet: (key) => (key === 'GOOGLE_MAPS_API_KEY' ? 'AIzaSySecretKey' : undefined),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, key: 'AIzaSySecretKey' });
  });

  it('sanitizes error responses and logs exception details server-side on failure', async () => {
    const sensitiveErrorMessage = 'Database connection failure at db.internal.cluster:5432';
    const mockBase44 = {
      auth: {
        me: vi.fn().mockImplementation(() => {
          throw new Error(sensitiveErrorMessage);
        }),
      },
    };

    const req = new Request('http://localhost/api/getMapsKey');
    const res = await handleGetMapsKeyRequest(req, {
      createClientFromRequest: () => mockBase44,
    });

    expect(res.status).toBe(500);
    const body = await res.json();

    // Verify response is sanitized and does NOT leak internal exception details
    expect(body).toEqual({ error: 'Internal server error' });
    expect(body.error).not.toContain(sensitiveErrorMessage);

    // Verify exception was logged server-side for debugging
    expect(consoleSpy).toHaveBeenCalled();
  });
});
