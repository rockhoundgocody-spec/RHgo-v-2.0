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
});
