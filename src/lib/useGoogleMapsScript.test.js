import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

// Mock react
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
  };
});

// Mock base44Client
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
  let stateMap;
  let effectCleanups;
  let headAppendedScripts;
  let originalWindow;
  let originalDocument;

  beforeEach(() => {
    vi.clearAllMocks();
    stateMap = new Map();
    effectCleanups = [];
    headAppendedScripts = [];

    base44.functions.invoke.mockResolvedValue({ data: {} });

    originalWindow = globalThis.window;
    originalDocument = globalThis.document;

    // Mock window and document
    globalThis.window = {
      ...originalWindow,
      google: undefined,
      GOOGLE_MAPS_API_KEY: undefined,
    };

    globalThis.document = {
      ...originalDocument,
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn((tag) => ({
        tagName: tag.toUpperCase(),
        dataset: {},
        src: '',
        async: false,
        onload: null,
        onerror: null,
      })),
      head: {
        appendChild: vi.fn((el) => {
          headAppendedScripts.push(el);
        }),
      },
    };

    let stateIndex = 0;
    React.useState.mockImplementation((initial) => {
      const idx = stateIndex++;
      const val = typeof initial === 'function' ? initial() : initial;
      const setter = vi.fn((newVal) => {
        stateMap.set(idx, typeof newVal === 'function' ? newVal(val) : newVal);
      });
      stateMap.set(idx, val);
      return [stateMap.get(idx), setter];
    });

    React.useEffect.mockImplementation((effect) => {
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        effectCleanups.push(cleanup);
      }
    });
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it('initializes with mapsReady true if window.google.maps.Map is already defined', () => {
    globalThis.window.google = { maps: { Map: class {} } };
    const { mapsReady } = useGoogleMapsScript();
    expect(mapsReady).toBe(true);
    expect(React.useState).toHaveBeenCalledWith(expect.any(Function));
  });

  it('fetches API key via base44 function if not available globally', () => {
    base44.functions.invoke.mockResolvedValueOnce({ data: { apiKey: 'fetched-key-123' } });

    useGoogleMapsScript();

    expect(base44.functions.invoke).toHaveBeenCalledWith('getMapsKey', {});
  });

  it('creates and appends script tag when apiKey is available and no existing script tag', () => {
    globalThis.window.GOOGLE_MAPS_API_KEY = 'test-api-key';

    useGoogleMapsScript();

    expect(globalThis.document.createElement).toHaveBeenCalledWith('script');
    expect(headAppendedScripts.length).toBe(1);
    const script = headAppendedScripts[0];
    expect(script.src).toContain('key=test-api-key');
    expect(script.dataset.rockhoundGmaps).toBe('1');
  });

  it('polls for Google Maps readiness if script tag already exists in document', () => {
    globalThis.window.GOOGLE_MAPS_API_KEY = 'test-api-key';
    const mockExistingScript = { dataset: { rockhoundGmaps: '1' } };
    globalThis.document.querySelector.mockReturnValue(mockExistingScript);

    vi.useFakeTimers();
    useGoogleMapsScript();

    expect(headAppendedScripts.length).toBe(0);
    expect(effectCleanups.length).toBe(1);

    vi.useRealTimers();
  });
});
