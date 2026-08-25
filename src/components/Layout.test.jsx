import { describe, it, expect, beforeAll } from 'vitest';

describe('getActiveTab', () => {
  let getActiveTab;

  beforeAll(async () => {
    const mockStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
    globalThis.window = {
      self: {},
      top: {},
      location: { href: 'http://localhost/', pathname: '/', search: '', hash: '' },
      history: { replaceState: () => {} },
      localStorage: mockStorage,
      sessionStorage: mockStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    globalThis.document = { title: 'Test' };
    const mod = await import('./Layout.jsx');
    getActiveTab = mod.getActiveTab;
  });

  it('returns / for root path', () => {
    expect(getActiveTab('/')).toBe('/');
  });

  it('returns matching primary route when path starts with primary section', () => {
    expect(getActiveTab('/explore')).toBe('/explore');
    expect(getActiveTab('/explore/hotspots/123')).toBe('/explore');
    expect(getActiveTab('/scan')).toBe('/scan');
    expect(getActiveTab('/scan/quick')).toBe('/scan');
    expect(getActiveTab('/collection')).toBe('/collection');
    expect(getActiveTab('/market')).toBe('/market');
  });

  it('defaults to / for unknown or admin/docs routes', () => {
    expect(getActiveTab('/admin')).toBe('/');
    expect(getActiveTab('/docs')).toBe('/');
    expect(getActiveTab('/settings')).toBe('/');
  });
});
