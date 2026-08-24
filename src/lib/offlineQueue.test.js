import { describe, it, expect, beforeEach, vi } from 'vitest';

// Configure mock window and localStorage before importing offlineQueue
if (typeof globalThis.window === 'undefined') {
  const localStorageMap = new Map();
  const mockLocalStorage = {
    getItem: vi.fn((key) => localStorageMap.get(key) ?? null),
    setItem: vi.fn((key, value) => localStorageMap.set(key, String(value))),
    removeItem: vi.fn((key) => localStorageMap.delete(key)),
    clear: vi.fn(() => localStorageMap.clear()),
  };

  const mockNavigator = { onLine: true };

  globalThis.window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    location: { href: 'http://localhost/', pathname: '/', search: '', hash: '' },
    history: { replaceState: vi.fn() },
    document: { title: 'Test' },
    localStorage: mockLocalStorage,
    navigator: mockNavigator,
  };
  globalThis.document = globalThis.window.document;
  globalThis.localStorage = mockLocalStorage;
  Object.defineProperty(globalThis, 'navigator', {
    value: mockNavigator,
    writable: true,
    configurable: true,
  });
}

const { flushQueue, queueWrite, getQueueLength } = await import('./offlineQueue');
const { base44 } = await import('@/api/base44Client');

describe('offlineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('flushes queued writes and updates localStorage correctly', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: '1' });
    const mockUpdate = vi.fn().mockResolvedValue({ id: '2' });
    base44.entities = {
      Specimen: { create: mockCreate, update: mockUpdate }
    };

    // Queue 3 writes while offline
    globalThis.navigator.onLine = false;
    await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Quartz' } });
    await queueWrite({ entity: 'Specimen', op: 'update', id: '2', data: { name: 'Amethyst' } });
    await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Gold' } });

    expect(getQueueLength()).toBe(3);

    // Switch online and flush
    globalThis.navigator.onLine = true;
    const result = await flushQueue();

    expect(result).toEqual({ flushed: 3, remaining: 0 });
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(getQueueLength()).toBe(0);
  });

  it('measures optimized performance and storage call counts during flush', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'test' });
    base44.entities = {
      Specimen: { create: mockCreate }
    };

    // Queue 100 items while offline
    globalThis.navigator.onLine = false;
    for (let i = 0; i < 100; i++) {
      await queueWrite({ entity: 'Specimen', op: 'create', data: { index: i } });
    }

    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();

    // Flush items while online
    globalThis.navigator.onLine = true;
    const startTime = performance.now();
    const result = await flushQueue();
    const endTime = performance.now();

    const totalStorageCalls = localStorage.setItem.mock.calls.length + localStorage.removeItem.mock.calls.length;
    console.log(`[Benchmark] Flush 100 items: ${(endTime - startTime).toFixed(2)}ms, storage I/O calls: ${totalStorageCalls}`);
    expect(result).toEqual({ flushed: 100, remaining: 0 });
    expect(totalStorageCalls).toBe(1);
    expect(getQueueLength()).toBe(0);
  });

  it('handles transient errors and preserves remaining queue in storage', async () => {
    let callCount = 0;
    const mockCreate = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 3) {
        throw new Error('Network timeout');
      }
      return { id: `id-${callCount}` };
    });
    base44.entities = {
      Specimen: { create: mockCreate }
    };

    globalThis.navigator.onLine = false;
    for (let i = 0; i < 5; i++) {
      await queueWrite({ entity: 'Specimen', op: 'create', data: { index: i } });
    }

    localStorage.setItem.mockClear();

    globalThis.navigator.onLine = true;
    const result = await flushQueue();

    expect(result).toEqual({ flushed: 2, remaining: 3 });
    expect(getQueueLength()).toBe(3);
    expect(localStorage.setItem.mock.calls.length).toBe(1);
  });

  it('evicts poison items on 4xx client errors', async () => {
    let callCount = 0;
    const mockCreate = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 2) {
        const err = new Error('Bad Request');
        err.status = 400;
        throw err;
      }
      return { id: `id-${callCount}` };
    });
    base44.entities = {
      Specimen: { create: mockCreate }
    };

    globalThis.navigator.onLine = false;
    for (let i = 0; i < 3; i++) {
      await queueWrite({ entity: 'Specimen', op: 'create', data: { index: i } });
    }

    globalThis.navigator.onLine = true;
    const result = await flushQueue();

    expect(result).toEqual({ flushed: 2, remaining: 0 });
    expect(getQueueLength()).toBe(0);
  });
});
