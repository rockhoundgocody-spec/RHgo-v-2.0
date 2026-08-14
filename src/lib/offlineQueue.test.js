import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        create: vi.fn(),
        update: vi.fn(),
      }
    }
  }
}));

describe('offlineQueue error handling', () => {
  beforeEach(() => {
    vi.resetModules();

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });

    vi.stubGlobal('navigator', {
      onLine: false
    });

    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loadQueue handles localStorage.getItem throwing by returning empty array', async () => {
    globalThis.localStorage.getItem.mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    const offlineQueue = await import('./offlineQueue.js');
    const len = offlineQueue.getQueueLength();

    expect(len).toBe(0);
    expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('rh-offline-queue-v1');
  });

  it('loadQueue parses and returns valid stored JSON', async () => {
    const mockData = [{ entity: 'Specimen', op: 'create', data: { name: 'Quartz' } }];
    globalThis.localStorage.getItem.mockReturnValue(JSON.stringify(mockData));

    const offlineQueue = await import('./offlineQueue.js');
    const len = offlineQueue.getQueueLength();

    expect(len).toBe(1);
    expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('rh-offline-queue-v1');
  });

  it('saveQueue handles localStorage.setItem throwing (storage full)', async () => {
    let callCount = 0;
    globalThis.localStorage.setItem.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        throw new Error('QuotaExceededError');
      }
    });

    globalThis.localStorage.getItem.mockReturnValue(JSON.stringify([
      { entity: 'Specimen', data: { id: 1 } },
      { entity: 'Specimen', data: { id: 2 } },
      { entity: 'Specimen', data: { id: 3 } }
    ]));

    const offlineQueue = await import('./offlineQueue.js');
    await offlineQueue.queueWrite({ entity: 'Specimen', data: { id: 4 } });

    expect(globalThis.localStorage.setItem).toHaveBeenCalledTimes(3);

    const lastCallArg = globalThis.localStorage.setItem.mock.lastCall[1];
    const savedArray = JSON.parse(lastCallArg);
    expect(savedArray.length).toBe(1);
  });

  it('saveQueue handles total storage failure gracefully by calling removeItem', async () => {
    globalThis.localStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const offlineQueue = await import('./offlineQueue.js');
    await offlineQueue.queueWrite({ entity: 'Specimen', data: { id: 1 } });

    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('rh-offline-queue-v1');
  });
});
