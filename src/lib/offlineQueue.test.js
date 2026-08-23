import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use vi.hoisted for variables referenced in vi.mock factories
const { mockSpecimenEntity } = vi.hoisted(() => {
  return {
    mockSpecimenEntity: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };
});

// Set up minimal global environment before module import
const localStorageStore = new Map();

const mockLocalStorage = {
  getItem: vi.fn((key) => localStorageStore.get(key) ?? null),
  setItem: vi.fn((key, value) => { localStorageStore.set(key, String(value)); }),
  removeItem: vi.fn((key) => { localStorageStore.delete(key); }),
  clear: vi.fn(() => { localStorageStore.clear(); }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

let mockOnLine = true;
Object.defineProperty(globalThis, 'navigator', {
  value: {
    get onLine() { return mockOnLine; }
  },
  configurable: true,
  writable: true,
});

// Mock window for DOM event listeners in node test environment
const mockWindow = {
  addEventListener: vi.fn(),
  setTimeout: globalThis.setTimeout,
};

Object.defineProperty(globalThis, 'window', {
  value: mockWindow,
  configurable: true,
  writable: true,
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: mockSpecimenEntity,
    },
  },
}));

import {
  queueWrite,
  flushQueue,
  getQueueLength,
  flushWhenStable,
  installOfflineQueue,
} from './offlineQueue.js';

const STORAGE_KEY = 'rh-offline-queue-v1';

describe('offlineQueue', () => {
  beforeEach(() => {
    localStorageStore.clear();
    vi.clearAllMocks();
    mockOnLine = true;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('queueWrite', () => {
    it('executes create online successfully and does not queue', async () => {
      const mockResult = { id: 'specimen-123', mineral_name: 'Quartz' };
      mockSpecimenEntity.create.mockResolvedValueOnce(mockResult);

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { mineral_name: 'Quartz' },
      });

      expect(mockSpecimenEntity.create).toHaveBeenCalledWith({ mineral_name: 'Quartz' });
      expect(res).toEqual({ ok: true, offline: false, result: mockResult });
      expect(getQueueLength()).toBe(0);
    });

    it('executes update online successfully and does not queue', async () => {
      const mockResult = { id: 'specimen-123', mineral_name: 'Amethyst' };
      mockSpecimenEntity.update.mockResolvedValueOnce(mockResult);

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'update',
        id: 'specimen-123',
        data: { mineral_name: 'Amethyst' },
      });

      expect(mockSpecimenEntity.update).toHaveBeenCalledWith('specimen-123', { mineral_name: 'Amethyst' });
      expect(res).toEqual({ ok: true, offline: false, result: mockResult });
      expect(getQueueLength()).toBe(0);
    });

    it('re-throws 4xx client errors and does not persist to queue', async () => {
      const clientErr = new Error('Bad Request');
      clientErr.status = 400;
      mockSpecimenEntity.create.mockRejectedValueOnce(clientErr);

      await expect(
        queueWrite({ entity: 'Specimen', op: 'create', data: { invalid: true } })
      ).rejects.toThrow('Bad Request');

      expect(getQueueLength()).toBe(0);
    });

    it('re-throws client errors matching err.response.status', async () => {
      const clientErr = { response: { status: 422 }, message: 'Unprocessable Entity' };
      mockSpecimenEntity.create.mockRejectedValueOnce(clientErr);

      await expect(
        queueWrite({ entity: 'Specimen', op: 'create', data: { invalid: true } })
      ).rejects.toEqual(clientErr);

      expect(getQueueLength()).toBe(0);
    });

    it('persists write to queue when online operation encounters a server error (5xx) or network failure', async () => {
      const serverErr = new Error('Internal Server Error');
      serverErr.status = 500;
      mockSpecimenEntity.create.mockRejectedValueOnce(serverErr);

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { mineral_name: 'Beryl' },
      });

      expect(res).toEqual({ ok: true, offline: true });
      expect(getQueueLength()).toBe(1);

      const storedQueue = JSON.parse(localStorageStore.get(STORAGE_KEY));
      expect(storedQueue[0]).toMatchObject({
        entity: 'Specimen',
        op: 'create',
        data: { mineral_name: 'Beryl' },
      });
      expect(typeof storedQueue[0].queuedAt).toBe('number');
    });

    it('persists write to queue directly when navigator is offline', async () => {
      mockOnLine = false;

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'update',
        id: 'specimen-999',
        data: { weight: 42 },
      });

      expect(mockSpecimenEntity.update).not.toHaveBeenCalled();
      expect(res).toEqual({ ok: true, offline: true });
      expect(getQueueLength()).toBe(1);

      const storedQueue = JSON.parse(localStorageStore.get(STORAGE_KEY));
      expect(storedQueue[0]).toMatchObject({
        entity: 'Specimen',
        op: 'update',
        id: 'specimen-999',
        data: { weight: 42 },
      });
    });
  });

  describe('flushQueue', () => {
    it('returns without flushing if navigator is offline', async () => {
      localStorageStore.set(
        STORAGE_KEY,
        JSON.stringify([{ entity: 'Specimen', op: 'create', data: { name: 'Pyrite' } }])
      );
      mockOnLine = false;

      const result = await flushQueue();

      expect(result).toEqual({ flushed: 0, remaining: 1 });
      expect(mockSpecimenEntity.create).not.toHaveBeenCalled();
    });

    it('flushes queued items sequentially when online', async () => {
      const items = [
        { entity: 'Specimen', op: 'create', data: { name: 'Pyrite' } },
        { entity: 'Specimen', op: 'update', id: 'sp-1', data: { name: 'Fool Gold' } },
      ];
      localStorageStore.set(STORAGE_KEY, JSON.stringify(items));

      mockSpecimenEntity.create.mockResolvedValueOnce({ id: 'sp-2' });
      mockSpecimenEntity.update.mockResolvedValueOnce({ id: 'sp-1' });

      const result = await flushQueue();

      expect(result).toEqual({ flushed: 2, remaining: 0 });
      expect(mockSpecimenEntity.create).toHaveBeenCalledWith({ name: 'Pyrite' });
      expect(mockSpecimenEntity.update).toHaveBeenCalledWith('sp-1', { name: 'Fool Gold' });
      expect(getQueueLength()).toBe(0);
    });

    it('evicts items referencing non-existent entities without stalling queue', async () => {
      const items = [
        { entity: 'UnknownEntity', op: 'create', data: { foo: 'bar' } },
        { entity: 'Specimen', op: 'create', data: { name: 'Quartz' } },
      ];
      localStorageStore.set(STORAGE_KEY, JSON.stringify(items));
      mockSpecimenEntity.create.mockResolvedValueOnce({ id: 'sp-3' });

      const result = await flushQueue();

      expect(result).toEqual({ flushed: 1, remaining: 0 });
      expect(mockSpecimenEntity.create).toHaveBeenCalledWith({ name: 'Quartz' });
      expect(getQueueLength()).toBe(0);
    });

    it('evicts items that fail with 4xx client errors during flush', async () => {
      const items = [
        { entity: 'Specimen', op: 'create', data: { invalid: true } },
        { entity: 'Specimen', op: 'create', data: { name: 'Quartz' } },
      ];
      localStorageStore.set(STORAGE_KEY, JSON.stringify(items));

      const err400 = new Error('Bad Request');
      err400.status = 400;
      mockSpecimenEntity.create.mockRejectedValueOnce(err400);
      mockSpecimenEntity.create.mockResolvedValueOnce({ id: 'sp-4' });

      const result = await flushQueue();

      expect(result).toEqual({ flushed: 1, remaining: 0 });
      expect(getQueueLength()).toBe(0);
    });

    it('retains transient failure items, updates attempt count, and halts flush pass', async () => {
      const items = [
        { entity: 'Specimen', op: 'create', data: { name: 'Item 1' }, attempts: 1 },
        { entity: 'Specimen', op: 'create', data: { name: 'Item 2' } },
      ];
      localStorageStore.set(STORAGE_KEY, JSON.stringify(items));

      const err500 = new Error('Server Unavailable');
      err500.status = 503;
      mockSpecimenEntity.create.mockRejectedValueOnce(err500);

      const result = await flushQueue();

      expect(result).toEqual({ flushed: 0, remaining: 2 });
      const storedQueue = JSON.parse(localStorageStore.get(STORAGE_KEY));
      expect(storedQueue[0].attempts).toBe(2);
      // Second item should not have been attempted
      expect(mockSpecimenEntity.create).toHaveBeenCalledTimes(1);
    });

    it('evicts items after reaching MAX_ATTEMPTS (5)', async () => {
      const items = [
        { entity: 'Specimen', op: 'create', data: { name: 'Poison Item' }, attempts: 4 },
        { entity: 'Specimen', op: 'create', data: { name: 'Valid Item' } },
      ];
      localStorageStore.set(STORAGE_KEY, JSON.stringify(items));

      const err500 = new Error('Repeated Server Failure');
      err500.status = 500;
      mockSpecimenEntity.create.mockRejectedValueOnce(err500);
      mockSpecimenEntity.create.mockResolvedValueOnce({ id: 'sp-valid' });

      const result = await flushQueue();

      expect(result).toEqual({ flushed: 1, remaining: 0 });
      expect(getQueueLength()).toBe(0);
    });
  });

  describe('getQueueLength', () => {
    it('returns 0 when queue is empty or unparseable', () => {
      expect(getQueueLength()).toBe(0);

      localStorageStore.set(STORAGE_KEY, 'invalid-json{{{');
      expect(getQueueLength()).toBe(0);
    });

    it('returns correct count when items are in queue', () => {
      localStorageStore.set(
        STORAGE_KEY,
        JSON.stringify([
          { entity: 'Specimen', op: 'create', data: {} },
          { entity: 'Specimen', op: 'create', data: {} },
        ])
      );
      expect(getQueueLength()).toBe(2);
    });
  });

  describe('flushWhenStable', () => {
    it('returns immediately if queue is empty', async () => {
      const res = await flushWhenStable();
      expect(res).toEqual({ flushed: 0, remaining: 0 });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('does not flush if connection probe fails', async () => {
      localStorageStore.set(
        STORAGE_KEY,
        JSON.stringify([{ entity: 'Specimen', op: 'create', data: { name: 'Agate' } }])
      );
      globalThis.fetch.mockRejectedValueOnce(new Error('Network error'));

      const res = await flushWhenStable();
      expect(res).toEqual({ flushed: 0, remaining: 1 });
      expect(mockSpecimenEntity.create).not.toHaveBeenCalled();
    });

    it('flushes queue when connection probe succeeds (status 204 or ok)', async () => {
      localStorageStore.set(
        STORAGE_KEY,
        JSON.stringify([{ entity: 'Specimen', op: 'create', data: { name: 'Agate' } }])
      );
      globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 204 });
      mockSpecimenEntity.create.mockResolvedValueOnce({ id: 'sp-agate' });

      const res = await flushWhenStable();
      expect(res).toEqual({ flushed: 1, remaining: 0 });
      expect(mockSpecimenEntity.create).toHaveBeenCalledWith({ name: 'Agate' });
    });
  });

  describe('storage full fallback', () => {
    it('halves batch size on storage quota error until write succeeds', async () => {
      let setItemCalls = 0;
      mockLocalStorage.setItem.mockImplementation((key, val) => {
        setItemCalls++;
        // Fail the first 2 calls with QuotaExceededError
        if (setItemCalls <= 2) {
          const quotaErr = new Error('QuotaExceededError');
          quotaErr.name = 'QuotaExceededError';
          throw quotaErr;
        }
        localStorageStore.set(key, String(val));
      });

      mockOnLine = false;
      // Add items
      await queueWrite({ entity: 'Specimen', op: 'create', data: { item: 1 } });
      await queueWrite({ entity: 'Specimen', op: 'create', data: { item: 2 } });
      await queueWrite({ entity: 'Specimen', op: 'create', data: { item: 3 } });
      await queueWrite({ entity: 'Specimen', op: 'create', data: { item: 4 } });

      expect(getQueueLength()).toBeGreaterThan(0);
    });
  });

  describe('installOfflineQueue', () => {
    it('registers event listeners idempotently', () => {
      installOfflineQueue();
      const firstCallCount = mockWindow.addEventListener.mock.calls.length;

      installOfflineQueue(); // second call should be no-op
      expect(mockWindow.addEventListener.mock.calls.length).toBe(firstCallCount);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });
});
