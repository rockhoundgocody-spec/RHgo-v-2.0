import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

let stateValue;
let setStateFn;
let effectFn;

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => {
      stateValue = typeof initial === 'function' ? initial() : initial;
      setStateFn = vi.fn((updater) => {
        stateValue = typeof updater === 'function' ? updater(stateValue) : updater;
      });
      return [stateValue, setStateFn];
    },
    useEffect: (cb) => {
      effectFn = cb;
    },
    useCallback: (fn) => fn,
  };
});

import { useServiceWorkerUpdate } from './useServiceWorkerUpdate.js';

describe('useServiceWorkerUpdate', () => {
  let originalNavigator;
  let originalLocation;
  let mockServiceWorker;
  let mockRegistration;
  let mockInstallingWorker;
  let mockWaitingWorker;
  let swListeners;
  let regListeners;
  let installingListeners;

  beforeEach(() => {
    vi.clearAllMocks();
    swListeners = new Map();
    regListeners = new Map();
    installingListeners = new Map();

    originalNavigator = globalThis.navigator;
    originalLocation = globalThis.location;

    mockWaitingWorker = {
      postMessage: vi.fn(),
    };

    mockInstallingWorker = {
      state: 'installing',
      addEventListener: vi.fn((event, handler) => {
        installingListeners.set(event, handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (installingListeners.get(event) === handler) {
          installingListeners.delete(event);
        }
      }),
    };

    mockRegistration = {
      waiting: null,
      installing: mockInstallingWorker,
      addEventListener: vi.fn((event, handler) => {
        regListeners.set(event, handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (regListeners.get(event) === handler) {
          regListeners.delete(event);
        }
      }),
    };

    mockServiceWorker = {
      controller: {},
      getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      addEventListener: vi.fn((event, handler) => {
        swListeners.set(event, handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (swListeners.get(event) === handler) {
          swListeners.delete(event);
        }
      }),
    };

    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: mockServiceWorker },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'location', {
      value: { reload: vi.fn() },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
  });

  it('should return initial updateAvailable as false and return applyUpdate function', () => {
    const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();
    expect(updateAvailable).toBe(false);
    expect(typeof applyUpdate).toBe('function');
  });

  it('should do nothing and return undefined from effect when navigator.serviceWorker is absent', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });

    useServiceWorkerUpdate();
    const cleanup = effectFn();

    expect(cleanup).toBeUndefined();
  });

  it('should set updateAvailable to true if registration already has a waiting worker', async () => {
    mockRegistration.waiting = mockWaitingWorker;

    useServiceWorkerUpdate();
    const cleanup = effectFn();

    // Wait for microtasks (getRegistration promise)
    await Promise.resolve();
    await Promise.resolve();

    expect(mockServiceWorker.getRegistration).toHaveBeenCalled();
    expect(setStateFn).toHaveBeenCalledWith(true);

    if (typeof cleanup === 'function') cleanup();
  });

  it('should register updatefound listener on registration and update state when statechange is installed', async () => {
    useServiceWorkerUpdate();
    const cleanup = effectFn();

    await Promise.resolve();
    await Promise.resolve();

    expect(regListeners.has('updatefound')).toBe(true);

    // Trigger updatefound event
    const handleUpdateFound = regListeners.get('updatefound');
    handleUpdateFound();

    expect(installingListeners.has('statechange')).toBe(true);

    // Trigger statechange with installingWorker state as 'installed'
    mockInstallingWorker.state = 'installed';
    const handleStateChange = installingListeners.get('statechange');
    handleStateChange();

    expect(setStateFn).toHaveBeenCalledWith(true);

    if (typeof cleanup === 'function') cleanup();
  });

  it('should remove existing statechange listener before adding new one when updatefound fires again', async () => {
    useServiceWorkerUpdate();
    const cleanup = effectFn();

    await Promise.resolve();
    await Promise.resolve();

    const handleUpdateFound = regListeners.get('updatefound');

    // First updatefound
    handleUpdateFound();
    expect(mockInstallingWorker.addEventListener).toHaveBeenCalledWith('statechange', expect.any(Function));

    // Second updatefound removes previous listener first
    handleUpdateFound();
    expect(mockInstallingWorker.removeEventListener).toHaveBeenCalledWith('statechange', expect.any(Function));

    if (typeof cleanup === 'function') cleanup();
  });

  it('should not set updateAvailable to true if installingWorker state is installed but controller is null', async () => {
    mockServiceWorker.controller = null;

    useServiceWorkerUpdate();
    const cleanup = effectFn();

    await Promise.resolve();
    await Promise.resolve();

    const handleUpdateFound = regListeners.get('updatefound');
    handleUpdateFound();

    mockInstallingWorker.state = 'installed';
    const handleStateChange = installingListeners.get('statechange');
    handleStateChange();

    expect(setStateFn).not.toHaveBeenCalledWith(true);

    if (typeof cleanup === 'function') cleanup();
  });

  it('should gracefully handle rejection from getRegistration() in effect', async () => {
    mockServiceWorker.getRegistration.mockRejectedValue(new Error('SW error'));

    useServiceWorkerUpdate();
    const cleanup = effectFn();

    await Promise.resolve();
    await Promise.resolve();

    expect(setStateFn).not.toHaveBeenCalled();

    if (typeof cleanup === 'function') cleanup();
  });

  it('should clean up listeners on unmount', async () => {
    useServiceWorkerUpdate();
    const cleanup = effectFn();

    await Promise.resolve();
    await Promise.resolve();

    const handleUpdateFound = regListeners.get('updatefound');
    handleUpdateFound();

    expect(regListeners.has('updatefound')).toBe(true);
    expect(installingListeners.has('statechange')).toBe(true);

    cleanup();

    expect(mockRegistration.removeEventListener).toHaveBeenCalledWith('updatefound', handleUpdateFound);
    expect(mockInstallingWorker.removeEventListener).toHaveBeenCalledWith('statechange', expect.any(Function));
  });

  describe('applyUpdate', () => {
    it('should return false if navigator.serviceWorker is missing', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
        writable: true,
      });

      const { applyUpdate } = useServiceWorkerUpdate();
      const result = await applyUpdate();

      expect(result).toBe(false);
    });

    it('should return false if getRegistration rejects', async () => {
      mockServiceWorker.getRegistration.mockRejectedValue(new Error('Failed'));

      const { applyUpdate } = useServiceWorkerUpdate();
      const result = await applyUpdate();

      expect(result).toBe(false);
    });

    it('should return false if registration has no waiting worker', async () => {
      mockRegistration.waiting = null;

      const { applyUpdate } = useServiceWorkerUpdate();
      const result = await applyUpdate();

      expect(result).toBe(false);
    });

    it('should send SKIP_WAITING to waiting worker and trigger reload on controllerchange', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      const { applyUpdate } = useServiceWorkerUpdate();
      const resultPromise = applyUpdate();

      await Promise.resolve();
      const result = await resultPromise;

      expect(result).toBe(true);
      expect(swListeners.has('controllerchange')).toBe(true);
      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });

      // Trigger controllerchange listener
      const onControllerChange = swListeners.get('controllerchange');
      onControllerChange();

      expect(globalThis.location.reload).toHaveBeenCalled();
    });
  });
});
