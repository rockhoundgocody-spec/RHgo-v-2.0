import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Set up global mocks for window, localStorage, fetch, navigator
let store = {};

const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value); }),
  removeItem: vi.fn((key) => { delete store[key]; }),
  clear: vi.fn(() => { store = {}; }),
};

globalThis.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

let mockOnLine = true;
Object.defineProperty(globalThis.navigator, 'onLine', {
  get: () => mockOnLine,
  configurable: true,
});

globalThis.fetch = vi.fn();

// Mock base44Client
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        create: (...args) => mockCreate(...args),
        update: (...args) => mockUpdate(...args),
      },
    },
  },
}));

import {
  schedulePeriodicRetry,
  getQueueLength,
  flushQueue,
  flushWhenStable,
  queueWrite,
  installOfflineQueue,
} from './offlineQueue.js';

const STORAGE_KEY = 'rh-offline-queue-v1';

describe('offlineQueue - schedulePeriodicRetry & timer behavior', () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnLine = true;
  });

  afterEach(async () => {
    // Empty store and advance timer so any active retryTimer cleans itself up
    store[STORAGE_KEY] = JSON.stringify([]);
    await vi.advanceTimersByTimeAsync(30_000);
    vi.useRealTimers();
  });

  it('schedules periodic retry timer and calls flushWhenStable when queue has items', async () => {
    store[STORAGE_KEY] = JSON.stringify([
      { entity: 'Specimen', op: 'create', data: { name: 'Agate' } },
    ]);
    expect(getQueueLength()).toBe(1);

    globalThis.fetch.mockResolvedValue({ ok: true, status: 204 });
    mockCreate.mockResolvedValue({ id: 'sp-1', name: 'Agate' });

    schedulePeriodicRetry();

    // Fast-forward interval (30_000ms)
    await vi.advanceTimersByTimeAsync(30_000);

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Agate' });
    expect(getQueueLength()).toBe(0);
  });

  it('prevents multiple timers when schedulePeriodicRetry is called repeatedly (retryTimer guard)', async () => {
    store[STORAGE_KEY] = JSON.stringify([
      { entity: 'Specimen', op: 'create', data: { name: 'Jasper' } },
    ]);

    globalThis.fetch.mockResolvedValue({ ok: true, status: 204 });
    mockCreate.mockResolvedValue({ id: 'sp-2', name: 'Jasper' });

    // Call schedulePeriodicRetry multiple times
    schedulePeriodicRetry();
    schedulePeriodicRetry();
    schedulePeriodicRetry();

    // Fast-forward interval (30_000ms)
    await vi.advanceTimersByTimeAsync(30_000);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({ name: 'Jasper' });
    expect(getQueueLength()).toBe(0);
  });

  it('clears interval and resets timer when queue becomes empty during tick', async () => {
    store[STORAGE_KEY] = JSON.stringify([]);
    expect(getQueueLength()).toBe(0);

    schedulePeriodicRetry();

    // Advance time by 30_000ms to trigger interval tick
    await vi.advanceTimersByTimeAsync(30_000);

    // Since queue is empty, retryTimer clears itself.
    // Verify by adding a new item directly to storage without calling schedulePeriodicRetry
    store[STORAGE_KEY] = JSON.stringify([
      { entity: 'Specimen', op: 'create', data: { name: 'Quartz' } },
    ]);

    globalThis.fetch.mockResolvedValue({ ok: true, status: 204 });
    mockCreate.mockResolvedValue({ id: 'sp-3', name: 'Quartz' });

    await vi.advanceTimersByTimeAsync(60_000);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('keeps retry timer active when queue items remain un-flushed due to unstable connection', async () => {
    store[STORAGE_KEY] = JSON.stringify([
      { entity: 'Specimen', op: 'create', data: { name: 'Opal' } },
    ]);

    // Unstable connection
    globalThis.fetch.mockRejectedValue(new Error('Network error'));

    schedulePeriodicRetry();

    // Advance 30s - probe fails, item stays in queue
    await vi.advanceTimersByTimeAsync(30_000);
    expect(getQueueLength()).toBe(1);

    // Connection recovers
    globalThis.fetch.mockResolvedValue({ ok: true, status: 204 });
    mockCreate.mockResolvedValue({ id: 'sp-4', name: 'Opal' });

    // Advance another 30s - periodic timer fires again and succeeds
    await vi.advanceTimersByTimeAsync(30_000);

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Opal' });
    expect(getQueueLength()).toBe(0);
  });
});

describe('offlineQueue - queueWrite & flush operations', () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnLine = true;
  });

  afterEach(async () => {
    store[STORAGE_KEY] = JSON.stringify([]);
    await vi.advanceTimersByTimeAsync(30_000);
    vi.useRealTimers();
  });

  it('executes write directly when online', async () => {
    mockCreate.mockResolvedValue({ id: 'sp-100', name: 'Flint' });

    const res = await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Flint' } });

    expect(res).toEqual({ ok: true, offline: false, result: { id: 'sp-100', name: 'Flint' } });
    expect(mockCreate).toHaveBeenCalledWith({ name: 'Flint' });
    expect(getQueueLength()).toBe(0);
  });

  it('queues write when offline and starts periodic retry', async () => {
    mockOnLine = false;

    const res = await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Geode' } });

    expect(res).toEqual({ ok: true, offline: true });
    expect(getQueueLength()).toBe(1);
  });

  it('queues write on network failure during online attempt', async () => {
    mockCreate.mockRejectedValue(new Error('Failed to fetch'));

    const res = await queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Obsidian' } });

    expect(res).toEqual({ ok: true, offline: true });
    expect(getQueueLength()).toBe(1);
  });

  it('re-throws 4xx client errors without queuing', async () => {
    const err = new Error('Bad Request');
    err.status = 400;
    mockCreate.mockRejectedValue(err);

    await expect(
      queueWrite({ entity: 'Specimen', op: 'create', data: { name: 'Invalid' } })
    ).rejects.toThrow('Bad Request');

    expect(getQueueLength()).toBe(0);
  });

  it('drops poisoned writes when status is 4xx or attempts >= MAX_ATTEMPTS during flushQueue', async () => {
    store[STORAGE_KEY] = JSON.stringify([
      { entity: 'Specimen', op: 'create', data: { name: 'Poison' }, attempts: 4 },
    ]);

    const err = new Error('Server error');
    err.status = 500;
    mockCreate.mockRejectedValue(err);

    await flushQueue();

    expect(getQueueLength()).toBe(0);
  });

  it('installOfflineQueue wires window event listeners and triggers initial flush', async () => {
    store[STORAGE_KEY] = JSON.stringify([
      { entity: 'Specimen', op: 'create', data: { name: 'Boot' } },
    ]);

    globalThis.fetch.mockResolvedValue({ ok: true, status: 204 });
    mockCreate.mockResolvedValue({ id: 'sp-boot', name: 'Boot' });

    installOfflineQueue();

    expect(globalThis.window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(globalThis.window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));

    // Advance 2000ms for boot timer
    await vi.advanceTimersByTimeAsync(2000);

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Boot' });
  });
});
