import { useState, useCallback } from 'react';
import { fetchAndCacheTile } from './offlineTileFetch';

/**
 * useOfflineTiles — prefetch a bounding-box tile pack into Cache Storage
 * so the map renders offline for a user's home region.
 *
 * Usage:
 *   const { prefetch, status, tileCount } = useOfflineTiles();
 *   await prefetch({ lat, lng, radiusMiles: 30, minZoom: 7, maxZoom: 12 });
 */

const CACHE_NAME = 'rh-tiles-v1';
const TILE_URL = (z, x, y) =>
  `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;

function lngToTileX(lng, z) {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, z));
}
function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, z)
  );
}
function tilesToLatLngBounds(tileLat, tileLng, z) {
  // degrees per tile at this zoom
  const n = Math.pow(2, z);
  return { dlat: 180 / n, dlng: 360 / n };
}

function getTileRange(lat, lng, radiusMiles, zoom) {
  const degPerMile = 1 / 69;
  const latDelta = radiusMiles * degPerMile;
  const lngDelta = radiusMiles * degPerMile / Math.cos((lat * Math.PI) / 180);

  const x0 = lngToTileX(lng - lngDelta, zoom);
  const x1 = lngToTileX(lng + lngDelta, zoom);
  const y0 = latToTileY(lat + latDelta, zoom);
  const y1 = latToTileY(lat - latDelta, zoom);

  const tiles = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }
  return tiles;
}

export default function useOfflineTiles() {
  const [status, setStatus] = useState('idle'); // idle | fetching | done | error
  const [progress, setProgress] = useState(0);
  const [tileCount, setTileCount] = useState(0);

  const prefetch = useCallback(async ({ lat, lng, radiusMiles = 30, minZoom = 7, maxZoom = 12 }) => {
    if (!('caches' in window)) {
      setStatus('error');
      return;
    }
    setStatus('fetching');
    setProgress(0);

    // Collect all tiles across zoom levels
    const allTiles = [];
    for (let z = minZoom; z <= maxZoom; z++) {
      allTiles.push(...getTileRange(lat, lng, radiusMiles, z));
    }
    setTileCount(allTiles.length);

    try {
      const cache = await caches.open(CACHE_NAME);
      let done = 0;
      let failures = 0;

      // Bulk check existing cached URLs once to avoid N+1 cache queries
      const existingKeys = await cache.keys();
      const cachedSet = new Set(existingKeys.map((req) => req.url));

      const uncachedTiles = [];
      for (const tile of allTiles) {
        const url = TILE_URL(tile.z, tile.x, tile.y);
        if (cachedSet.has(url)) {
          done++;
        } else {
          uncachedTiles.push({ tile, url });
        }
      }

      if (allTiles.length > 0) {
        setProgress(Math.round((done / allTiles.length) * 100));
      }

      // Batch fetch — 8 concurrent to avoid saturating the network
      const BATCH = 8;
      for (let i = 0; i < uncachedTiles.length; i += BATCH) {
        const batch = uncachedTiles.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(async ({ url }) => {
            try {
              await fetchAndCacheTile(url, cache);
            } finally {
              done++;
              setProgress(Math.round((done / allTiles.length) * 100));
            }
          })
        );
        failures += results.filter((result) => result.status === 'rejected').length;
      }

      setStatus(failures === 0 ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }, []);

  const clear = useCallback(async () => {
    if ('caches' in window) await caches.delete(CACHE_NAME);
    setStatus('idle');
    setProgress(0);
    setTileCount(0);
  }, []);

  return { prefetch, clear, status, progress, tileCount };
}
