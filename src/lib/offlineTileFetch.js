const TILE_HOST = 'mt1.google.com';

export async function fetchAndCacheTile(url, cache, fetchImpl = fetch) {
  const parsed = new URL(url);
  const isTilePath = /^\/vt\/lyrs=y&x=-?\d+&y=-?\d+&z=\d+$/.test(parsed.pathname);
  if (parsed.protocol !== 'https:' || parsed.hostname !== TILE_HOST || !isTilePath) {
    throw new Error('Unsupported tile URL');
  }

  const response = await fetchImpl(url, {
    mode: 'cors',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  const contentType = response.headers?.get?.('content-type') || '';
  if (!response.ok || response.type === 'opaque' || !contentType.toLowerCase().startsWith('image/')) {
    throw new Error('Invalid tile response');
  }

  await cache.put(url, response);
}
