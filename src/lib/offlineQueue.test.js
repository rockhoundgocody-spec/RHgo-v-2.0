import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: { create: vi.fn(), update: vi.fn() },
      Hotspot: { create: vi.fn(), update: vi.fn() },
    },
  },
}));

beforeAll(() => {
  globalThis.window = globalThis.window || {};
  globalThis.window.localStorage = mockLocalStorage;
  globalThis.localStorage = mockLocalStorage;
});

describe('offlineQueue', () => {
  let offlineQueue;

  beforeEach(async () => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    vi.resetModules();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    offlineQueue = await import('./offlineQueue.js');
  });

  it('flushes items successfully', async () => {
    const { base44 } = await import('@/api/base44Client');
    base44.entities.Specimen.create.mockResolvedValue({ id: '1' });
    base44.entities.Hotspot.update.mockResolvedValue({ id: '2' });

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    await offlineQueue.queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Quartz' } });
    await offlineQueue.queueWrite({ entity: 'Hotspot', op: 'update', id: '2', data: { trust_score: 1 } });
    expect(offlineQueue.getQueueLength()).toBe(2);

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    const result = await offlineQueue.flushQueue();
    expect(result.flushed).toBe(2);
    expect(result.remaining).toBe(0);
    expect(offlineQueue.getQueueLength()).toBe(0);

    expect(base44.entities.Specimen.create).toHaveBeenCalledWith({ name: 'Quartz' });
    expect(base44.entities.Hotspot.update).toHaveBeenCalledWith('2', { trust_score: 1 });
  });

  it('evicts non-existent entity from queue', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    await offlineQueue.queueWrite({ entity: 'NonExistentEntity', op: 'create', data: { foo: 'bar' } });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });

    const result = await offlineQueue.flushQueue();
    expect(result.flushed).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it('drops poison write on 4xx client error', async () => {
    const { base44 } = await import('@/api/base44Client');
    base44.entities.Specimen.create.mockRejectedValue({ status: 400, message: 'Bad request' });
    base44.entities.Hotspot.create.mockResolvedValue({ id: '2' });

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    await offlineQueue.queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Bad' } });
    await offlineQueue.queueWrite({ entity: 'Hotspot', op: 'create', data: { name: 'Good' } });

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    const result = await offlineQueue.flushQueue();
    expect(result.flushed).toBe(1);
    expect(result.remaining).toBe(0);
  });

  it('stops queue processing and increments attempt count on 5xx transient error', async () => {
    const { base44 } = await import('@/api/base44Client');
    base44.entities.Specimen.create.mockRejectedValue({ status: 500, message: 'Server error' });

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    await offlineQueue.queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'RetryMe' } });
    await offlineQueue.queueWrite({ entity: 'Hotspot', op: 'create', data: { name: 'Waiting' } });

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    const result = await offlineQueue.flushQueue();
    expect(result.flushed).toBe(0);
    expect(result.remaining).toBe(2);
    expect(offlineQueue.getQueueLength()).toBe(2);
  });

  it('drops write after MAX_ATTEMPTS reached', async () => {
    const { base44 } = await import('@/api/base44Client');
    base44.entities.Specimen.create.mockRejectedValue({ status: 503, message: 'Service Unavailable' });

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    await offlineQueue.queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'RetryMe' } });

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });

    // Flush 4 times (attempts 1, 2, 3, 4)
    for (let i = 0; i < 4; i++) {
      await offlineQueue.flushQueue();
      expect(offlineQueue.getQueueLength()).toBe(1);
    }

    // 5th flush should reach MAX_ATTEMPTS = 5 and drop the item
    const result = await offlineQueue.flushQueue();
    expect(result.remaining).toBe(0);
    expect(offlineQueue.getQueueLength()).toBe(0);
  });
});
