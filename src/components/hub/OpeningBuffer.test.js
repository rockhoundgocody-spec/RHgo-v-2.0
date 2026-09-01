import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

describe('getDeviceId', () => {
  let getDeviceId;
  const storage = {};

  beforeAll(async () => {
    const mockStorage = {
      getItem: (key) => storage[key] || null,
      setItem: (key, val) => { storage[key] = String(val); },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); }
    };

    globalThis.document = { title: '' };
    globalThis.window = {
      location: {
        search: '',
        pathname: '/',
        hash: '',
        href: 'http://localhost/'
      },
      history: {
        replaceState: () => {}
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      localStorage: mockStorage
    };
    globalThis.localStorage = mockStorage;

    const mod = await import('./OpeningBuffer.jsx');
    getDeviceId = mod.getDeviceId;
  });

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('generates a device ID starting with dev_ and persists it to localStorage', () => {
    expect(globalThis.localStorage.getItem('rhgo_device_id')).toBeNull();

    const id = getDeviceId();

    expect(id).toMatch(/^dev_/);
    expect(globalThis.localStorage.getItem('rhgo_device_id')).toBe(id);
  });

  it('returns existing device ID from localStorage if present', () => {
    globalThis.localStorage.setItem('rhgo_device_id', 'dev_existing_12345');

    const id = getDeviceId();

    expect(id).toBe('dev_existing_12345');
  });

  it('uses crypto.randomUUID when available', () => {
    const spy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('12345678-abcd-ef01-2345-6789abcdef01');
    try {
      const id = getDeviceId();
      expect(id).toBe('dev_12345678-abcd-ef01-2345-6789abcdef01');
    } finally {
      spy.mockRestore();
    }
  });

  it('uses crypto.getRandomValues when randomUUID is not available', () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis.crypto), 'randomUUID');
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true, writable: true });
    const getValuesSpy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i;
      return arr;
    });
    try {
      const id = getDeviceId();
      expect(id).toMatch(/^dev_[a-z0-9]+_000102030405060708090a0b0c0d0e0f$/);
    } finally {
      if (desc) Object.defineProperty(globalThis.crypto, 'randomUUID', desc);
      getValuesSpy.mockRestore();
    }
  });

  it('handles fallback when crypto APIs are absent without using Math.random', () => {
    const descUUID = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis.crypto), 'randomUUID');
    const descGetRandomValues = Object.getOwnPropertyDescriptor(globalThis.crypto, 'getRandomValues') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis.crypto), 'getRandomValues');
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true, writable: true });
    Object.defineProperty(globalThis.crypto, 'getRandomValues', { value: undefined, configurable: true, writable: true });
    const origMathRandom = Math.random;
    let mathRandomCalled = false;
    Math.random = () => {
      mathRandomCalled = true;
      return 0.5;
    };
    try {
      const id = getDeviceId();
      expect(id).toMatch(/^dev_/);
      expect(mathRandomCalled).toBe(false);
    } finally {
      if (descUUID) Object.defineProperty(globalThis.crypto, 'randomUUID', descUUID);
      if (descGetRandomValues) Object.defineProperty(globalThis.crypto, 'getRandomValues', descGetRandomValues);
      Math.random = origMathRandom;
    }
  });
});
