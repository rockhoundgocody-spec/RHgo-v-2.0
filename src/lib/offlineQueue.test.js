import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Define global window/localStorage for Node environment
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _getStore: () => store,
  };
})();

let onlineStatus = true;

if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { get onLine() { return onlineStatus; } },
    writable: true,
    configurable: true,
  });
} else {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    get: () => onlineStatus,
    configurable: true,
  });
}

globalThis.window = globalThis.window || {};
globalThis.localStorage = mockLocalStorage;

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        create: vi.fn(),
        update: vi.fn(),
      },
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
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'rh-offline-queue-v1';

describe('offlineQueue', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    onlineStatus = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Corrupt / Malformed JSON in localStorage edge case', () => {
    it('returns 0 queue length and [] when localStorage contains corrupt JSON', () => {
      // Simulate corrupt JSON stored under rh-offline-queue-v1
      mockLocalStorage.setItem(STORAGE_KEY, '{ invalid json structure ...');

      // getQueueLength calls loadQueue under the hood
      expect(getQueueLength()).toBe(0);
    });

    it('handles queueWrite cleanly when existing localStorage content is corrupt JSON', async () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'invalid json');
      onlineStatus = false; // Force offline so queueWrite pushes to queue

      // Attempt queueing a write while offline
      const result = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Quartz' },
      });

      expect(result).toEqual({ ok: true, offline: true });
      expect(getQueueLength()).toBe(1);

      // Verify localStorage was overwritten with valid JSON array containing the new item
      const stored = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY));
      expect(stored).toHaveLength(1);
      expect(stored[0].data).toEqual({ name: 'Quartz' });
    });

    it('returns empty remaining queue when flushQueue runs with corrupt JSON in localStorage', async () => {
      mockLocalStorage.setItem(STORAGE_KEY, '<<<BAD_JSON>>>');

      const result = await flushQueue();
      expect(result).toEqual({ flushed: 0, remaining: 0 });
    });
  });

  describe('Happy Path & Valid Queue Operations', () => {
    it('stores write in queue when offline', async () => {
      onlineStatus = false;

      const result = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Agate' },
      });

      expect(result.ok).toBe(true);
      expect(result.offline).toBe(true);
      expect(getQueueLength()).toBe(1);
    });

    it('sends directly when online', async () => {
      onlineStatus = true;
      base44.entities.Specimen.create.mockResolvedValueOnce({ id: 'spec_1' });

      const result = await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Agate' },
      });

      expect(result).toEqual({ ok: true, offline: false, result: { id: 'spec_1' } });
      expect(getQueueLength()).toBe(0);
    });

    it('flushes queued items when online', async () => {
      // First queue item offline
      onlineStatus = false;
      await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Jasper' },
      });
      expect(getQueueLength()).toBe(1);

      // Go online and flush
      onlineStatus = true;
      base44.entities.Specimen.create.mockResolvedValueOnce({ id: 'spec_123' });

      const flushResult = await flushQueue();

      expect(flushResult).toEqual({ flushed: 1, remaining: 0 });
      expect(base44.entities.Specimen.create).toHaveBeenCalledWith({ name: 'Jasper' });
      expect(getQueueLength()).toBe(0);
    });

    it('handles updates in the queue', async () => {
      onlineStatus = false;
      await queueWrite({
        entity: 'Specimen',
        op: 'update',
        id: 'spec_123',
        data: { name: 'Updated Agate' },
      });

      onlineStatus = true;
      base44.entities.Specimen.update.mockResolvedValueOnce({ id: 'spec_123', name: 'Updated Agate' });

      const flushResult = await flushQueue();

      expect(flushResult).toEqual({ flushed: 1, remaining: 0 });
      expect(base44.entities.Specimen.update).toHaveBeenCalledWith('spec_123', { name: 'Updated Agate' });
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('evicts items on 4xx client errors during flush', async () => {
      // Queue offline
      onlineStatus = false;
      await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { invalid: true },
      });

      // Go online and flush where create fails with 400
      onlineStatus = true;
      base44.entities.Specimen.create.mockRejectedValueOnce({ status: 400, message: 'Bad Request' });

      const flushResult = await flushQueue();

      expect(flushResult).toEqual({ flushed: 0, remaining: 0 });
      expect(getQueueLength()).toBe(0);
    });

    it('retains transient errors and increments attempts', async () => {
      // Queue offline
      onlineStatus = false;
      await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Pyrite' },
      });

      // Go online and flush where create fails with 500
      onlineStatus = true;
      base44.entities.Specimen.create.mockRejectedValueOnce({ status: 500, message: 'Server Error' });

      const flushResult = await flushQueue();

      expect(flushResult).toEqual({ flushed: 0, remaining: 1 });
      const stored = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY));
      expect(stored[0].attempts).toBe(1);
    });
  });
});
