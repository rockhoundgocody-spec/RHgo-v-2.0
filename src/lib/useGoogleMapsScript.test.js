import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';

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

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('useGoogleMapsScript', () => {
  let effects;
  let setMapsReady;
  let setApiKey;
  let setLoadError;
  let originalWindow;
  let originalDocument;
  let hadWindow;
  let hadDocument;

  const renderHook = (libraries) => useGoogleMapsScript(libraries);
  const runEffect = (index) => effects[index]();

  beforeEach(() => {
    hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
    hadDocument = Object.prototype.hasOwnProperty.call(globalThis, 'document');
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;

    setMapsReady = vi.fn();
    setApiKey = vi.fn();
    setLoadError = vi.fn();
    effects = [];

    const setters = [setMapsReady, setApiKey, setLoadError];
    let stateIndex = 0;
    React.useState.mockImplementation((initial) => {
      const value = typeof initial === 'function' ? initial() : initial;
      return [value, setters[stateIndex++]];
    });
    React.useEffect.mockImplementation((effect) => effects.push(effect));

    globalThis.window = {};
    globalThis.document = {
      querySelector: vi.fn(() => null),
      createElement: vi.fn(() => ({ dataset: {} })),
      head: { appendChild: vi.fn() },
    };
    base44.functions.invoke.mockReset();
    base44.functions.invoke.mockResolvedValue({ data: { apiKey: 'backend-key' } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    if (hadWindow) globalThis.window = originalWindow;
    else delete globalThis.window;
    if (hadDocument) globalThis.document = originalDocument;
    else delete globalThis.document;
  });

  it('starts ready and skips key fetching when Google Maps and a window key already exist', () => {
    const Map = class {};
    window.google = { maps: { Map } };
    window.GOOGLE_MAPS_API_KEY = 'window-key';

    const result = renderHook();
    runEffect(0);
    runEffect(1);

    expect(result).toEqual({ mapsReady: true, apiKey: 'window-key', loadError: false });
    expect(base44.functions.invoke).not.toHaveBeenCalled();
    expect(document.querySelector).not.toHaveBeenCalled();
    expect(setMapsReady).toHaveBeenCalledWith(true);
  });

  it('uses the Vite environment key when no window key is configured', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'vite-key');

    const result = renderHook();
    runEffect(0);

    expect(result.apiKey).toBe('vite-key');
    expect(base44.functions.invoke).not.toHaveBeenCalled();
  });

  it('is safe to initialize without a window during server-side rendering', () => {
    delete globalThis.window;

    const result = renderHook();

    expect(result).toEqual({ mapsReady: false, apiKey: null, loadError: false });
  });

  it.each([
    [{ data: { apiKey: 'api-key-field' } }, 'api-key-field'],
    [{ data: { key: 'legacy-key-field' } }, 'legacy-key-field'],
  ])('fetches a missing API key from the backend response %#', async (response, expectedKey) => {
    base44.functions.invoke.mockResolvedValueOnce(response);
    renderHook();

    runEffect(0);
    await flushPromises();

    expect(base44.functions.invoke).toHaveBeenCalledOnce();
    expect(base44.functions.invoke).toHaveBeenCalledWith('getMapsKey', {});
    expect(setApiKey).toHaveBeenCalledWith(expectedKey);
    expect(setLoadError).not.toHaveBeenCalled();
  });

  it('reports an error when the backend returns no usable key', async () => {
    base44.functions.invoke.mockResolvedValueOnce({ data: {} });
    renderHook();

    runEffect(0);
    await flushPromises();

    expect(setApiKey).not.toHaveBeenCalled();
    expect(setLoadError).toHaveBeenCalledWith(true);
  });

  it('reports an error when fetching the key rejects', async () => {
    base44.functions.invoke.mockRejectedValueOnce(new Error('network unavailable'));
    renderHook();

    runEffect(0);
    await flushPromises();

    expect(setApiKey).not.toHaveBeenCalled();
    expect(setLoadError).toHaveBeenCalledWith(true);
  });

  it('does not inspect or inject scripts until an API key is available', () => {
    renderHook();

    const cleanup = runEffect(1);

    expect(cleanup).toBeUndefined();
    expect(document.querySelector).not.toHaveBeenCalled();
    expect(document.createElement).not.toHaveBeenCalled();
  });

  it('injects a tagged async script with the default libraries and handles a successful load', () => {
    window.GOOGLE_MAPS_API_KEY = 'window-key';
    const script = { dataset: {} };
    document.createElement.mockReturnValue(script);
    renderHook();

    runEffect(1);

    expect(document.querySelector).toHaveBeenCalledWith('script[data-rockhound-gmaps]');
    expect(document.createElement).toHaveBeenCalledWith('script');
    expect(script).toMatchObject({
      src: 'https://maps.googleapis.com/maps/api/js?key=window-key&v=weekly&libraries=places,geometry',
      async: true,
      dataset: { rockhoundGmaps: '1' },
    });
    expect(document.head.appendChild).toHaveBeenCalledOnce();
    expect(document.head.appendChild).toHaveBeenCalledWith(script);

    window.google = { maps: { Map: class {} } };
    script.onload();
    expect(setMapsReady).toHaveBeenCalledWith(true);
  });

  it('includes custom libraries in the injected script URL', () => {
    window.GOOGLE_MAPS_API_KEY = 'window-key';
    const script = { dataset: {} };
    document.createElement.mockReturnValue(script);
    renderHook('drawing,visualization');

    runEffect(1);

    expect(script.src).toBe(
      'https://maps.googleapis.com/maps/api/js?key=window-key&v=weekly&libraries=drawing,visualization'
    );
  });

  it('reports an injected script load failure', () => {
    window.GOOGLE_MAPS_API_KEY = 'window-key';
    const script = { dataset: {} };
    document.createElement.mockReturnValue(script);
    renderHook();

    runEffect(1);
    script.onerror();

    expect(setLoadError).toHaveBeenCalledWith(true);
    expect(setMapsReady).not.toHaveBeenCalled();
  });

  it('polls an existing script until Google Maps becomes available', () => {
    vi.useFakeTimers();
    window.GOOGLE_MAPS_API_KEY = 'window-key';
    document.querySelector.mockReturnValue({});
    renderHook();

    runEffect(1);
    vi.advanceTimersByTime(100);
    expect(setMapsReady).not.toHaveBeenCalled();

    window.google = { maps: { Map: class {} } };
    vi.advanceTimersByTime(100);

    expect(setMapsReady).toHaveBeenCalledWith(true);
    expect(setLoadError).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(document.createElement).not.toHaveBeenCalled();
  });

  it('times out after 100 polls when an existing script never becomes ready', () => {
    vi.useFakeTimers();
    window.GOOGLE_MAPS_API_KEY = 'window-key';
    document.querySelector.mockReturnValue({});
    renderHook();

    runEffect(1);
    vi.advanceTimersByTime(10_000);

    expect(setMapsReady).not.toHaveBeenCalled();
    expect(setLoadError).toHaveBeenCalledWith(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels existing-script polling during effect cleanup', () => {
    vi.useFakeTimers();
    window.GOOGLE_MAPS_API_KEY = 'window-key';
    document.querySelector.mockReturnValue({});
    renderHook();

    const cleanup = runEffect(1);
    cleanup();
    window.google = { maps: { Map: class {} } };
    vi.advanceTimersByTime(10_000);

    expect(vi.getTimerCount()).toBe(0);
    expect(setMapsReady).not.toHaveBeenCalled();
    expect(setLoadError).not.toHaveBeenCalled();
  });
});
