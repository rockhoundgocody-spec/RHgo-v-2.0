import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

// Mock react's useState and useEffect to inspect hook execution
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
  };
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { base44 } from '@/api/base44Client';
import { useGoogleMapsScript } from './useGoogleMapsScript.js';

describe('useGoogleMapsScript', () => {
  let mockSetMapsReady;
  let mockSetApiKey;
  let mockSetLoadError;
  let originalWindow;
  let originalDocument;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetMapsReady = vi.fn();
    mockSetApiKey = vi.fn();
    mockSetLoadError = vi.fn();

    originalWindow = globalThis.window;
    originalDocument = globalThis.document;

    base44.functions.invoke.mockResolvedValue({ data: { apiKey: 'default-key' } });

    // Standard mock setup for useState
    let stateCallCount = 0;
    React.useState.mockImplementation((initial) => {
      const callIndex = stateCallCount++;
      const val = typeof initial === 'function' ? initial() : initial;
      if (callIndex % 3 === 0) return [val, mockSetMapsReady];
      if (callIndex % 3 === 1) return [val, mockSetApiKey];
      return [val, mockSetLoadError];
    });

    React.useEffect.mockImplementation((effect) => {
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        React._lastCleanup = cleanup;
      }
    });
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it('detects when window.google.maps.Map is already defined', () => {
    globalThis.window = {
      google: { maps: { Map: class {} } },
    };

    const res = useGoogleMapsScript();
    expect(res.mapsReady).toBe(true);
  });

  it('fetches API key from base44 backend function when missing', async () => {
    globalThis.window = {};
    const promise = Promise.resolve({ data: { apiKey: 'backend-key-123' } });
    base44.functions.invoke.mockReturnValueOnce(promise);

    useGoogleMapsScript();

    expect(base44.functions.invoke).toHaveBeenCalledWith('getMapsKey', {});
    await promise;
    expect(mockSetApiKey).toHaveBeenCalledWith('backend-key-123');
  });

  it('sets loadError when base44 function fails', async () => {
    globalThis.window = {};
    const promise = Promise.reject(new Error('Network error'));
    base44.functions.invoke.mockReturnValueOnce(promise);

    useGoogleMapsScript();

    try {
      await promise;
    } catch {
      // Expected rejection
    }
    await new Promise((r) => setTimeout(r, 0));
    expect(mockSetLoadError).toHaveBeenCalledWith(true);
  });

  it('creates script element and appends to head when apiKey is present', () => {
    const appendedScripts = [];
    globalThis.window = { GOOGLE_MAPS_API_KEY: 'test-api-key' };
    globalThis.document = {
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockImplementation((tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          dataset: {},
        };
        return el;
      }),
      head: {
        appendChild: vi.fn((el) => {
          appendedScripts.push(el);
        }),
      },
    };

    useGoogleMapsScript('places,geometry');

    expect(document.createElement).toHaveBeenCalledWith('script');
    expect(appendedScripts[0].src).toContain('https://maps.googleapis.com/maps/api/js?key=test-api-key');
    expect(appendedScripts[0].src).toContain('libraries=places,geometry');
    expect(appendedScripts[0].dataset.rockhoundGmaps).toBe('1');

    // Simulate onload callback
    appendedScripts[0].onload();
    expect(mockSetMapsReady).toHaveBeenCalledWith(true);

    // Simulate onerror callback
    appendedScripts[0].onerror();
    expect(mockSetLoadError).toHaveBeenCalledWith(true);
  });

  it('polls when script element with data-rockhound-gmaps already exists in DOM', () => {
    vi.useFakeTimers();
    const existingScript = {};
    globalThis.window = { GOOGLE_MAPS_API_KEY: 'test-api-key' };
    globalThis.document = {
      querySelector: vi.fn().mockReturnValue(existingScript),
    };

    useGoogleMapsScript();

    expect(document.querySelector).toHaveBeenCalledWith('script[data-rockhound-gmaps]');

    // Before window.google maps is ready
    vi.advanceTimersByTime(100);
    expect(mockSetMapsReady).not.toHaveBeenCalled();

    // Now set window.google.maps.Map
    globalThis.window.google = { maps: { Map: class {} } };
    vi.advanceTimersByTime(100);
    expect(mockSetMapsReady).toHaveBeenCalledWith(true);

    vi.useRealTimers();
  });
});
