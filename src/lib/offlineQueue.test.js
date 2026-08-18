import { vi, describe, it, expect, beforeEach } from 'vitest';

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

// Setup mock localStorage before importing module
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import { getQueueLength, queueWrite } from './offlineQueue.js';

describe('offlineQueue - getQueueLength', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return 0 when queue in localStorage is empty', () => {
    expect(getQueueLength()).toBe(0);
  });

  it('should return the correct number of items in queue', () => {
    const mockItems = [
      { entity: 'Specimen', op: 'create', data: { name: 'Quartz' } },
      { entity: 'Specimen', op: 'create', data: { name: 'Amethyst' } },
    ];
    localStorageMock.setItem('rh-offline-queue-v1', JSON.stringify(mockItems));

    expect(getQueueLength()).toBe(2);
  });

  it('should return 0 if localStorage data is corrupted or invalid JSON', () => {
    localStorageMock.setItem('rh-offline-queue-v1', '{ invalid json ...');

    expect(getQueueLength()).toBe(0);
  });

  it('should reflect increased queue length when a write is queued offline', async () => {
    // Force offline mode for queueWrite
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    try {
      expect(getQueueLength()).toBe(0);

      await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Jasper' },
      });

      expect(getQueueLength()).toBe(1);

      await queueWrite({
        entity: 'Specimen',
        op: 'create',
        data: { name: 'Agate' },
      });

      expect(getQueueLength()).toBe(2);
    } finally {
      if (originalNavigator !== undefined) {
        Object.defineProperty(globalThis, 'navigator', {
          value: originalNavigator,
          configurable: true,
          writable: true,
        });
      }
    }
  });
});
