import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

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
  it('does not invoke Math.random when generating a device ID', () => {
    const originalMathRandom = Math.random;
    let mathRandomCalled = false;
    Math.random = () => {
      mathRandomCalled = true;
      return originalMathRandom();
    };

    try {
      const id = getDeviceId();
      expect(id).toMatch(/^dev_/);
      expect(mathRandomCalled).toBe(false);
    } finally {
      Math.random = originalMathRandom;
    }
  });

  it('uses crypto.getRandomValues when randomUUID is unavailable', () => {
    const originalRandomUUID = globalThis.crypto.randomUUID;
    const originalGetRandomValues = globalThis.crypto.getRandomValues;
    let getRandomValuesCalled = false;

    globalThis.crypto.randomUUID = undefined;
    globalThis.crypto.getRandomValues = (array) => {
      getRandomValuesCalled = true;
      for (let i = 0; i < array.length; i++) {
        array[i] = i;
      }
      return array;
    };

    try {
      const id = getDeviceId();
      expect(id).toMatch(/^dev_/);
      expect(getRandomValuesCalled).toBe(true);
    } finally {
      if (originalRandomUUID) {
        globalThis.crypto.randomUUID = originalRandomUUID;
      }
      globalThis.crypto.getRandomValues = originalGetRandomValues;
    }
  });
  it('uses crypto.randomUUID when available', () => {
    const originalRandomUUID = globalThis.crypto.randomUUID;
    let randomUUIDCalled = false;

    globalThis.crypto.randomUUID = () => {
      randomUUIDCalled = true;
      return '12345678-1234-4234-8234-123456789abc';
    };

    try {
      const id = getDeviceId();
      expect(id).toBe('dev_12345678-1234-4234-8234-123456789abc');
      expect(randomUUIDCalled).toBe(true);
    } finally {
      globalThis.crypto.randomUUID = originalRandomUUID;
    }
  });
});
