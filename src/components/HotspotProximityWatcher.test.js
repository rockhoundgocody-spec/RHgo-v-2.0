import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

beforeAll(() => {
  globalThis.document = /** @type {any} */ ({ title: '' });
  globalThis.window = /** @type {any} */ ({
    location: {
      search: '',
      href: '',
      pathname: '',
      hash: '',
    },
    history: {
      replaceState: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    localStorage: mockLocalStorage,
  });
  globalThis.localStorage = /** @type {any} */ (mockLocalStorage);
});

describe('HotspotProximityWatcher utilities', () => {
  let STORAGE_KEY, getDismissed, saveDismissed, formatDistance;

  beforeAll(async () => {
    const mod = await import('./HotspotProximityWatcher.jsx');
    STORAGE_KEY = mod.STORAGE_KEY;
    getDismissed = mod.getDismissed;
    saveDismissed = mod.saveDismissed;
    formatDistance = mod.formatDistance;
  });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getDismissed & saveDismissed', () => {
    it('returns empty object when nothing is stored', () => {
      expect(getDismissed()).toEqual({});
    });

    it('saves and retrieves dismissed hotspot ids for today', () => {
      const ids = { 'hotspot-123': true, 'hotspot-456': true };
      saveDismissed(ids);

      const result = getDismissed();
      expect(result).toEqual(ids);
    });

    it('returns empty object if stored date is not today', () => {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: yesterday, ids: { 'hotspot-1': true } }));

      expect(getDismissed()).toEqual({});
    });

    it('handles corrupted JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');
      expect(getDismissed()).toEqual({});
    });
  });

  describe('HotspotProximityBanner Component', () => {
    it('renders with type="button" on action buttons and descriptive aria-label on dismiss button', async () => {
      const { renderToStaticMarkup } = await import('react-dom/server');
      const React = await import('react');
      const { MemoryRouter } = await import('react-router-dom');
      const { HotspotProximityBanner } = await import('./HotspotProximityWatcher.jsx');

      const mockNearby = {
        distance_m: 500,
        hotspot: { id: 'hs-1', name: 'Crystal Ridge' },
      };

      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(HotspotProximityBanner, {
            nearby: mockNearby,
            permission: 'default',
            requestPermission: () => {},
            onDismiss: () => {},
            hotspotId: 'hs-1',
          })
        )
      );

      expect(html).toContain('type="button"');
      expect(html).toContain('aria-label="Dismiss hotspot notification"');
      expect(html).toContain('Enable push notifications');
    });
  });

  describe('formatDistance', () => {
    it('converts meters to miles and kilometers formatted to 1 decimal place', () => {
      const { distMiles, distKm } = formatDistance(1609.34);
      expect(distMiles).toBe('1.0');
      expect(distKm).toBe('1.6');
    });

    it('handles zero or small distances correctly', () => {
      const { distMiles, distKm } = formatDistance(0);
      expect(distMiles).toBe('0.0');
      expect(distKm).toBe('0.0');
    });

    it('handles fallback for null/undefined/invalid distance_m', () => {
      const { distMiles, distKm } = formatDistance(null);
      expect(distMiles).toBe('0.0');
      expect(distKm).toBe('0.0');
    });
  });
});
