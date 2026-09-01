import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useCallback: vi.fn((fn) => fn),
  };
});

vi.mock('./offlineTileFetch', () => ({
  fetchAndCacheTile: vi.fn().mockResolvedValue(undefined),
}));

import useOfflineTiles from './useOfflineTiles';
import { fetchAndCacheTile } from './offlineTileFetch';

describe('useOfflineTiles', () => {
  let mockSetStatus;
  let mockSetProgress;
  let mockSetTileCount;
  let stateMap;

  beforeEach(() => {
    vi.clearAllMocks();
    stateMap = new Map();

    mockSetStatus = vi.fn((val) => stateMap.set('status', val));
    mockSetProgress = vi.fn((val) => stateMap.set('progress', val));
    mockSetTileCount = vi.fn((val) => stateMap.set('tileCount', val));

    let stateCallIndex = 0;
    React.useState.mockImplementation((initial) => {
      const idx = stateCallIndex++;
      if (idx === 0) return [stateMap.get('status') ?? initial, mockSetStatus];
      if (idx === 1) return [stateMap.get('progress') ?? initial, mockSetProgress];
      if (idx === 2) return [stateMap.get('tileCount') ?? initial, mockSetTileCount];
      return [initial, vi.fn()];
    });

    globalThis.window = globalThis;
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it('handles missing caches API gracefully', async () => {
    const originalCaches = globalThis.caches;
    delete globalThis.caches;

    const { prefetch } = useOfflineTiles();
    await prefetch({ lat: 40, lng: -100, radiusMiles: 5, minZoom: 7, maxZoom: 7 });

    expect(mockSetStatus).toHaveBeenCalledWith('error');

    if (originalCaches) globalThis.caches = originalCaches;
  });

  it('prefetches tiles using Cache API', async () => {
    const mockCache = {
      match: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
    };
    globalThis.caches = {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn().mockResolvedValue(true),
    };

    const { prefetch } = useOfflineTiles();
    await prefetch({ lat: 40, lng: -100, radiusMiles: 1, minZoom: 7, maxZoom: 7 });

    expect(globalThis.caches.open).toHaveBeenCalledWith('rh-tiles-v1');
    expect(fetchAndCacheTile).toHaveBeenCalled();
    expect(mockSetStatus).toHaveBeenCalledWith('done');
  });

  it('clears tile cache', async () => {
    globalThis.caches = {
      delete: vi.fn().mockResolvedValue(true),
    };

    const { clear } = useOfflineTiles();
    await clear();

    expect(globalThis.caches.delete).toHaveBeenCalledWith('rh-tiles-v1');
    expect(mockSetStatus).toHaveBeenCalledWith('idle');
    expect(mockSetProgress).toHaveBeenCalledWith(0);
    expect(mockSetTileCount).toHaveBeenCalledWith(0);
  });
});
