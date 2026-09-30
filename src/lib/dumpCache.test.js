import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dumpAllCaches } from './dumpCache';
import { queryClientInstance } from '@/lib/query-client';
import { clearCachedModels } from '@/lib/modelCache';

vi.mock('@/lib/query-client', () => ({
  queryClientInstance: {
    clear: vi.fn(),
  },
}));

vi.mock('@/lib/modelCache', () => ({
  clearCachedModels: vi.fn(),
}));

describe('dumpAllCaches', () => {
  let originalIndexedDB;
  let originalLocalStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    originalIndexedDB = globalThis.indexedDB;
    originalLocalStorage = globalThis.localStorage;
  });

  afterEach(() => {
    if (originalIndexedDB !== undefined) {
      globalThis.indexedDB = originalIndexedDB;
    } else {
      delete globalThis.indexedDB;
    }

    if (originalLocalStorage !== undefined) {
      globalThis.localStorage = originalLocalStorage;
    } else {
      delete globalThis.localStorage;
    }
  });

  it('clears reactQuery, modelCache, indexedDB, and localStorage successfully', async () => {
    // Mock IndexedDB
    const deletedDatabases = [];
    globalThis.indexedDB = {
      deleteDatabase: vi.fn((name) => {
        deletedDatabases.push(name);
        const req = {};
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      }),
    };

    // Mock localStorage
    const store = new Map([
      ['rhgo_scans_123', '5'],
      ['rh_offline_hotspots', '[]'],
      ['rhgo_intro_seen', 'true'],
      ['b44_token', 'secret_token'],
      ['rh-offline-queue-v1', '[]'],
      ['rhgo_kid_mode', 'true'],
    ]);

    globalThis.localStorage = {
      get length() {
        return store.size;
      },
      key: vi.fn((index) => Array.from(store.keys())[index] ?? null),
      removeItem: vi.fn((key) => store.delete(key)),
      getItem: vi.fn((key) => store.get(key) ?? null),
      setItem: vi.fn((key, value) => store.set(key, value)),
    };

    vi.mocked(clearCachedModels).mockResolvedValue(undefined);

    const result = await dumpAllCaches();

    expect(queryClientInstance.clear).toHaveBeenCalledTimes(1);
    expect(clearCachedModels).toHaveBeenCalledTimes(1);

    expect(deletedDatabases).toEqual(['rockhound-offline', 'rockhound-images']);

    expect(result).toEqual({
      reactQuery: true,
      models: true,
      offline: true,
      images: true,
      localStorageCleared: 3,
    });

    // Check that ephemeral cache keys were deleted from localStorage
    expect(store.has('rhgo_scans_123')).toBe(false);
    expect(store.has('rh_offline_hotspots')).toBe(false);
    expect(store.has('rhgo_intro_seen')).toBe(false);

    // Check that protected keys were preserved
    expect(store.has('b44_token')).toBe(true);
    expect(store.has('rh-offline-queue-v1')).toBe(true);
    expect(store.has('rhgo_kid_mode')).toBe(true);
  });

  it('handles errors in reactQuery and modelCache gracefully', async () => {
    vi.mocked(queryClientInstance.clear).mockImplementation(() => {
      throw new Error('Query client clear failed');
    });

    vi.mocked(clearCachedModels).mockRejectedValue(new Error('Model cache clear failed'));

    globalThis.indexedDB = {
      deleteDatabase: vi.fn(() => {
        const req = {};
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      }),
    };

    globalThis.localStorage = {
      length: 0,
      key: vi.fn(() => null),
      removeItem: vi.fn(),
    };

    const result = await dumpAllCaches();

    expect(result.reactQuery).toBe(false);
    expect(result.models).toBe(false);
  });

  it('handles IndexedDB errors and blocked callbacks gracefully', async () => {
    vi.mocked(clearCachedModels).mockResolvedValue(undefined);

    let callCount = 0;
    globalThis.indexedDB = {
      deleteDatabase: vi.fn((name) => {
        callCount++;
        const req = {};
        setTimeout(() => {
          if (name === 'rockhound-offline') {
            if (req.onerror) req.onerror();
          } else if (name === 'rockhound-images') {
            if (req.onblocked) req.onblocked();
          }
        }, 0);
        return req;
      }),
    };

    globalThis.localStorage = {
      length: 0,
      key: vi.fn(() => null),
      removeItem: vi.fn(),
    };

    const result = await dumpAllCaches();

    expect(result.offline).toBe(false);
    expect(result.images).toBe(false);
  });

  it('handles IndexedDB deleteDatabase throwing synchronously', async () => {
    vi.mocked(clearCachedModels).mockResolvedValue(undefined);

    globalThis.indexedDB = {
      deleteDatabase: vi.fn(() => {
        throw new Error('IndexedDB access denied');
      }),
    };

    globalThis.localStorage = {
      length: 0,
      key: vi.fn(() => null),
      removeItem: vi.fn(),
    };

    const result = await dumpAllCaches();

    expect(result.offline).toBe(false);
    expect(result.images).toBe(false);
  });

  it('handles localStorage throwing errors gracefully', async () => {
    vi.mocked(clearCachedModels).mockResolvedValue(undefined);

    globalThis.indexedDB = {
      deleteDatabase: vi.fn(() => {
        const req = {};
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      }),
    };

    globalThis.localStorage = {
      get length() {
        throw new Error('SecurityError: localStorage blocked');
      },
      key: vi.fn(),
      removeItem: vi.fn(),
    };

    const result = await dumpAllCaches();

    expect(result.localStorageCleared).toBe(0);
  });
});
