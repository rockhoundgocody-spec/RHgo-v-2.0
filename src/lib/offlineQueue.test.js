import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Setup mock window, navigator, and localStorage before importing offlineQueue
const storageStore = new Map();

const mockLocalStorage = {
  getItem: vi.fn((key) => storageStore.get(key) ?? null),
  setItem: vi.fn((key, value) => { storageStore.set(key, String(value)); }),
  removeItem: vi.fn((key) => { storageStore.delete(key); }),
  clear: vi.fn(() => { storageStore.clear(); }),
};

const mockNavigator = {
  onLine: true,
};

globalThis.window = globalThis.window || {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    writable: true,
    configurable: true,
  });
} catch {
  globalThis.navigator = mockNavigator;
}

try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
} catch {
  globalThis.localStorage = mockLocalStorage;
}

// Mock base44 client
const mockEntityCreate = vi.fn();
const mockEntityUpdate = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        create: (...args) => mockEntityCreate(...args),
        update: (...args) => mockEntityUpdate(...args),
      },
    },
  },
}));

import {
  queueWrite,
  flushQueue,
  getQueueLength,
  flushWhenStable,
} from './offlineQueue.js';

describe('offlineQueue', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    storageStore.clear();
    vi.clearAllMocks();
    mockNavigator.onLine = true;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('queueWrite', () => {
    it('should write directly to network when online and return success', async () => {
      const mockResult = { id: 'spec-1', name: 'Agate' };
      mockEntityCreate.mockResolvedValueOnce(mockResult);

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Agate' },
      });

      expect(mockEntityCreate).toHaveBeenCalledWith({ name: 'Agate' });
      expect(res).toEqual({ ok: true, offline: false, result: mockResult });
      expect(getQueueLength()).toBe(0);
    });

    it('should update entity directly when online for op=update', async () => {
      const mockResult = { id: 'spec-1', name: 'Updated Agate' };
      mockEntityUpdate.mockResolvedValueOnce(mockResult);

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'update',
        id: 'spec-1',
        data: { name: 'Updated Agate' },
      });

      expect(mockEntityUpdate).toHaveBeenCalledWith('spec-1', { name: 'Updated Agate' });
      expect(res).toEqual({ ok: true, offline: false, result: mockResult });
      expect(getQueueLength()).toBe(0);
    });

    it('should rethrow 4xx client errors without queueing', async () => {
      const clientError = { status: 422, message: 'Unprocessable Entity' };
      mockEntityCreate.mockRejectedValueOnce(clientError);

      await expect(
        queueWrite({
          entity: 'Specimen',
          op: 'create',
          data: { invalid: true },
        })
      ).rejects.toEqual(clientError);

      expect(getQueueLength()).toBe(0);
    });

    it('should rethrow 400 status error from err.response.status', async () => {
      const clientError = { response: { status: 400 }, message: 'Bad Request' };
      mockEntityCreate.mockRejectedValueOnce(clientError);

      await expect(
        queueWrite({
          entity: 'Specimen',
          op: 'create',
          data: { invalid: true },
        })
      ).rejects.toEqual(clientError);

      expect(getQueueLength()).toBe(0);
    });

    it('should queue write in localStorage when network request fails with a network/server error', async () => {
      const networkError = new Error('Network error');
      mockEntityCreate.mockRejectedValueOnce(networkError);

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Jasper' },
      });

      expect(res).toEqual({ ok: true, offline: true });
      expect(getQueueLength()).toBe(1);

      const savedData = JSON.parse(mockLocalStorage.getItem('rh-offline-queue-v1'));
      expect(savedData).toHaveLength(1);
      expect(savedData[0]).toMatchObject({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Jasper' },
      });
      expect(savedData[0].queuedAt).toBeDefined();
    });

    it('should queue write in localStorage directly when navigator is offline', async () => {
      mockNavigator.onLine = false;

      const res = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Quartz' },
      });

      expect(mockEntityCreate).not.toHaveBeenCalled();
      expect(res).toEqual({ ok: true, offline: true });
      expect(getQueueLength()).toBe(1);
    });

    it('should handle quota exceeded by halving queue during saveQueue', async () => {
      mockNavigator.onLine = false;
      let setItemCalls = 0;
      mockLocalStorage.setItem.mockImplementation((key, value) => {
        setItemCalls++;
        if (setItemCalls === 1) {
          throw new DOMException('QuotaExceededError');
        }
        storageStore.set(key, String(value));
      });

      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Item 1' } });
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Item 2' } });

      expect(setItemCalls).toBeGreaterThan(1);
    });
  });

  describe('flushQueue', () => {
    it('should do nothing and return 0 flushed if browser is offline', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Geode' } });
      expect(getQueueLength()).toBe(1);

      const flushRes = await flushQueue();
      expect(flushRes).toEqual({ flushed: 0, remaining: 1 });
      expect(mockEntityCreate).not.toHaveBeenCalled();
    });

    it('should flush queued items when back online', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Amethyst' } });
      await queueWrite({ entity: 'Specimen', op: 'update', id: '123', data: { notes: 'Clustered' } });
      expect(getQueueLength()).toBe(2);

      mockNavigator.onLine = true;
      mockEntityCreate.mockResolvedValueOnce({ id: '456', name: 'Amethyst' });
      mockEntityUpdate.mockResolvedValueOnce({ id: '123', notes: 'Clustered' });

      const flushRes = await flushQueue();
      expect(flushRes).toEqual({ flushed: 2, remaining: 0 });
      expect(mockEntityCreate).toHaveBeenCalledWith({ name: 'Amethyst' });
      expect(mockEntityUpdate).toHaveBeenCalledWith('123', { notes: 'Clustered' });
      expect(getQueueLength()).toBe(0);
    });

    it('should evict poisoned 4xx items from queue during flush', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'Specimen', op: 'create', data: { bad: true } });
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Pyrite' } });
      expect(getQueueLength()).toBe(2);

      mockNavigator.onLine = true;
      mockEntityCreate
        .mockRejectedValueOnce({ status: 404, message: 'Not Found' })
        .mockResolvedValueOnce({ id: '789', name: 'Pyrite' });

      const flushRes = await flushQueue();
      expect(flushRes).toEqual({ flushed: 1, remaining: 0 });
      expect(getQueueLength()).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'offlineQueue: dropping unsendable write',
        'Specimen',
        'create',
        404
      );
    });

    it('should record attempt count and stop flushing on transient network error during flush', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Obsidian' } });

      mockNavigator.onLine = true;
      mockEntityCreate.mockRejectedValueOnce(new Error('503 Service Unavailable'));

      const flushRes = await flushQueue();
      expect(flushRes).toEqual({ flushed: 0, remaining: 1 });

      const queue = JSON.parse(mockLocalStorage.getItem('rh-offline-queue-v1'));
      expect(queue[0].attempts).toBe(1);
    });

    it('should evict item after reaching MAX_ATTEMPTS (5 attempts)', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Flint' } });

      mockNavigator.onLine = true;
      const queue = JSON.parse(mockLocalStorage.getItem('rh-offline-queue-v1'));
      queue[0].attempts = 4;
      mockLocalStorage.setItem('rh-offline-queue-v1', JSON.stringify(queue));

      mockEntityCreate.mockRejectedValueOnce(new Error('500 Internal Error'));

      const flushRes = await flushQueue();
      expect(flushRes).toEqual({ flushed: 0, remaining: 0 });
      expect(getQueueLength()).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should skip items for unknown entity definitions', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'NonExistentEntity', op: 'create', data: {} });
      expect(getQueueLength()).toBe(1);

      mockNavigator.onLine = true;
      const flushRes = await flushQueue();
      expect(flushRes).toEqual({ flushed: 0, remaining: 0 });
    });
  });

  describe('flushWhenStable', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should return immediately if queue is empty', async () => {
      const res = await flushWhenStable();
      expect(res).toEqual({ flushed: 0, remaining: 0 });
    });

    it('should not flush if connection probe fails', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Fossil' } });

      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Offline probe'));

      const res = await flushWhenStable();
      expect(res).toEqual({ flushed: 0, remaining: 1 });
    });

    it('should flush when connection probe succeeds', async () => {
      mockNavigator.onLine = false;
      await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Fossil' } });

      mockNavigator.onLine = true;
      globalThis.fetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 204 });
      mockEntityCreate.mockResolvedValueOnce({ id: '99', name: 'Fossil' });

      const res = await flushWhenStable();
      expect(res).toEqual({ flushed: 1, remaining: 0 });
    });
  });
});
