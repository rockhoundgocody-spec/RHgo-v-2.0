import { describe, expect, it, vi } from 'vitest';
import { fetchAndCacheTile } from './offlineTileFetch';

const tileUrl = 'https://mt1.google.com/vt/lyrs=y&x=20&y=30&z=7';

function tileResponse(overrides = {}) {
  return {
    ok: true,
    type: 'cors',
    headers: { get: () => 'image/jpeg' },
    ...overrides,
  };
}

describe('fetchAndCacheTile', () => {
  it('uses credential-free CORS and caches validated images', async () => {
    const cache = { put: vi.fn().mockResolvedValue(undefined) };
    const response = tileResponse();
    const fetchImpl = vi.fn().mockResolvedValue(response);

    await fetchAndCacheTile(tileUrl, cache, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(tileUrl, {
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    expect(cache.put).toHaveBeenCalledWith(tileUrl, response);
  });

  it.each([
    tileResponse({ ok: false }),
    tileResponse({ type: 'opaque' }),
    tileResponse({ headers: { get: () => 'text/html' } }),
  ])('rejects invalid responses without polluting the cache', async (response) => {
    const cache = { put: vi.fn() };
    await expect(fetchAndCacheTile(tileUrl, cache, vi.fn().mockResolvedValue(response))).rejects.toThrow();
    expect(cache.put).not.toHaveBeenCalled();
  });

  it('rejects unexpected tile hosts before fetching', async () => {
    const fetchImpl = vi.fn();
    await expect(fetchAndCacheTile('https://evil.example/vt?x=1', { put: vi.fn() }, fetchImpl)).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
