import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// Mock localStorage
const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
    // Helper for tests to inspect store
    _getStore: () => store,
  };
};

describe('dumpCache - dumpAllCaches', () => {
  let localStorageMock;
  let deleteDatabaseMock;

  beforeEach(() => {
    vi.clearAllMocks();

    localStorageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Mock indexedDB
    deleteDatabaseMock = vi.fn((name) => {
      const req = {
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };
      // Default to auto-resolving onsuccess in microtask
      Promise.resolve().then(() => {
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    });

    Object.defineProperty(globalThis, 'indexedDB', {
      value: { deleteDatabase: deleteDatabaseMock },
      writable: true,
      configurable: true,
    });

    clearCachedModels.mockResolvedValue();
  });

  it('clears all caches successfully on happy path', async () => {
    // Populate localStorage with cache keys & non-cache keys
    localStorageMock.setItem('rhgo_scans_user1', 'scans');
    localStorageMock.setItem('rh_offline_hotspots_v1', 'hotspots');
    localStorageMock.setItem('rhgo_intro_seen', 'true');
    localStorageMock.setItem('rhgo_onboarding_complete', 'true');
    localStorageMock.setItem('rhgo_hub_first_visit', 'true');

    // Non-cache keys that must be preserved
    localStorageMock.setItem('b44_auth_token', 'jwt_secret');
    localStorageMock.setItem('rh-offline-queue-v1', 'queue_data');
    localStorageMock.setItem('clover_voice', 'enabled');
    localStorageMock.setItem('rhgo_kid_mode', 'false');

    const result = await dumpAllCaches();

    expect(queryClientInstance.clear).toHaveBeenCalledTimes(1);
    expect(clearCachedModels).toHaveBeenCalledTimes(1);
    expect(deleteDatabaseMock).toHaveBeenCalledWith('rockhound-offline');
    expect(deleteDatabaseMock).toHaveBeenCalledWith('rockhound-images');

    expect(result).toEqual({
      reactQuery: true,
      models: true,
      offline: true,
      images: true,
      localStorageCleared: 5,
    });

    // Verify localStorage cleared items
    const remainingStore = localStorageMock._getStore();
    expect(remainingStore['rhgo_scans_user1']).toBeUndefined();
    expect(remainingStore['rh_offline_hotspots_v1']).toBeUndefined();
    expect(remainingStore['rhgo_intro_seen']).toBeUndefined();
    expect(remainingStore['rhgo_onboarding_complete']).toBeUndefined();
    expect(remainingStore['rhgo_hub_first_visit']).toBeUndefined();

    // Verify preserved keys
    expect(remainingStore['b44_auth_token']).toBe('jwt_secret');
    expect(remainingStore['rh-offline-queue-v1']).toBe('queue_data');
    expect(remainingStore['clover_voice']).toBe('enabled');
    expect(remainingStore['rhgo_kid_mode']).toBe('false');
  });

  it('handles queryClientInstance.clear failure gracefully', async () => {
    queryClientInstance.clear.mockImplementationOnce(() => {
      throw new Error('React query error');
    });

    const result = await dumpAllCaches();

    expect(result.reactQuery).toBe(false);
    expect(result.models).toBe(true);
    expect(result.offline).toBe(true);
    expect(result.images).toBe(true);
  });

  it('handles clearCachedModels rejection gracefully', async () => {
    clearCachedModels.mockRejectedValueOnce(new Error('IndexedDB error in modelCache'));

    const result = await dumpAllCaches();

    expect(result.reactQuery).toBe(true);
    expect(result.models).toBe(false);
    expect(result.offline).toBe(true);
    expect(result.images).toBe(true);
  });

  it('handles indexedDB deleteDatabase onerror callback', async () => {
    deleteDatabaseMock.mockImplementation((name) => {
      const req = { onsuccess: null, onerror: null, onblocked: null };
      Promise.resolve().then(() => {
        if (name === 'rockhound-offline' && req.onerror) {
          req.onerror();
        } else if (req.onsuccess) {
          req.onsuccess();
        }
      });
      return req;
    });

    const result = await dumpAllCaches();

    expect(result.offline).toBe(false);
    expect(result.images).toBe(true);
  });

  it('handles indexedDB deleteDatabase onblocked callback', async () => {
    deleteDatabaseMock.mockImplementation((name) => {
      const req = { onsuccess: null, onerror: null, onblocked: null };
      Promise.resolve().then(() => {
        if (name === 'rockhound-images' && req.onblocked) {
          req.onblocked();
        } else if (req.onsuccess) {
          req.onsuccess();
        }
      });
      return req;
    });

    const result = await dumpAllCaches();

    expect(result.offline).toBe(true);
    expect(result.images).toBe(false);
  });

  it('handles indexedDB deleteDatabase synchronous exception', async () => {
    deleteDatabaseMock.mockImplementation(() => {
      throw new Error('IndexedDB disabled or blocked');
    });

    const result = await dumpAllCaches();

    expect(result.offline).toBe(false);
    expect(result.images).toBe(false);
  });

  it('handles localStorage throwing an error when accessed', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      get: () => {
        throw new Error('SecurityError: Access to localStorage is denied');
      },
      configurable: true,
    });

    const result = await dumpAllCaches();

    expect(result.localStorageCleared).toBe(0);
  });

  it('skips null keys returned from localStorage.key()', async () => {
    // Mock key method to return null for an existing length
    localStorageMock.key.mockReturnValue(null);
    localStorageMock.setItem('rhgo_intro_seen', 'true');

    const result = await dumpAllCaches();

    expect(result.localStorageCleared).toBe(0);
  });
});
