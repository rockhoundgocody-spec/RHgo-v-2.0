// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  haversineMi,
  formatDistance,
  persistLastGps,
  readLastGps,
  watchGps,
  rankHotspots,
  escapeHtml,
} from './geo';

describe('geo library', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('haversineMi', () => {
    it('returns null for missing or invalid coordinate objects', () => {
      expect(haversineMi(null, { lat: 10, lng: 20 })).toBeNull();
      expect(haversineMi({ lat: 10, lng: 20 }, null)).toBeNull();
      expect(haversineMi({ lat: null, lng: 20 }, { lat: 10, lng: 20 })).toBeNull();
      expect(haversineMi({ lat: 10, lng: 20 }, { lat: 10, lng: null })).toBeNull();
    });

    it('calculates accurate distance in miles between two points', () => {
      // Seattle (47.6062, -122.3321) to Portland (45.5152, -122.6784) ~ 145 miles
      const seattle = { lat: 47.6062, lng: -122.3321 };
      const portland = { lat: 45.5152, lng: -122.6784 };
      const dist = haversineMi(seattle, portland);
      expect(dist).toBeGreaterThan(140);
      expect(dist).toBeLessThan(150);
    });

    it('returns 0 for identical coordinates', () => {
      const p = { lat: 45.0, lng: -120.0 };
      expect(haversineMi(p, p)).toBeCloseTo(0);
    });
  });

  describe('formatDistance', () => {
    it('returns null for null, undefined, or NaN', () => {
      expect(formatDistance(null)).toBeNull();
      expect(formatDistance(undefined)).toBeNull();
      expect(formatDistance(NaN)).toBeNull();
    });

    it('formats distances < 0.1 mi', () => {
      expect(formatDistance(0.05)).toBe('<0.1 mi');
    });

    it('formats distances < 10 mi with 1 decimal place', () => {
      expect(formatDistance(3.42)).toBe('3.4 mi');
      expect(formatDistance(9.91)).toBe('9.9 mi');
    });

    it('formats distances >= 10 mi rounded to whole integer', () => {
      expect(formatDistance(12.7)).toBe('13 mi');
      expect(formatDistance(100.2)).toBe('100 mi');
    });
  });

  describe('persistLastGps & readLastGps', () => {
    it('persists and reads back valid GPS coordinates', () => {
      const coords = { lat: 45.5, lng: -122.6 };
      persistLastGps(coords);
      const read = readLastGps();
      expect(read).toEqual(coords);
    });

    it('ignores invalid or out-of-bounds coordinates when persisting', () => {
      persistLastGps(null);
      expect(readLastGps()).toBeNull();

      persistLastGps({ lat: 100, lng: -122.6 });
      expect(readLastGps()).toBeNull();

      persistLastGps({ lat: 45.5, lng: 200 });
      expect(readLastGps()).toBeNull();

      persistLastGps({ lat: 'invalid', lng: -122.6 });
      expect(readLastGps()).toBeNull();
    });

    it('returns null if cached GPS exceeds maxAgeMs', () => {
      const coords = { lat: 45.5, lng: -122.6 };
      persistLastGps(coords);

      // Fast-forward time past maxAgeMs (default 6h)
      const future = Date.now() + 1000 * 60 * 60 * 7;
      vi.spyOn(Date, 'now').mockReturnValue(future);

      expect(readLastGps()).toBeNull();
    });
  });

  describe('watchGps', () => {
    it('returns a noop cleanup function if onFix is not a function', () => {
      const cleanup = watchGps(null);
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    it('invokes onFix with cached GPS if available', () => {
      const coords = { lat: 45.5, lng: -122.6 };
      persistLastGps(coords);

      const onFix = vi.fn();
      watchGps(onFix);

      expect(onFix).toHaveBeenCalledWith(coords);
    });

    it('returns noop if navigator.geolocation is not supported', () => {
      const originalGeo = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const onFix = vi.fn();
      const cleanup = watchGps(onFix);

      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();

      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeo,
        writable: true,
        configurable: true,
      });
    });

    it('watches geolocation and calls onFix when geolocation updates', () => {
      const getCurrentPosition = vi.fn((success) => {
        success({
          coords: { latitude: 45.523, longitude: -122.676 },
        });
      });

      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition },
        writable: true,
        configurable: true,
      });

      const onFix = vi.fn();
      const cleanup = watchGps(onFix);

      expect(getCurrentPosition).toHaveBeenCalled();
      expect(onFix).toHaveBeenCalledWith({ lat: 45.523, lng: -122.676 });
      expect(readLastGps()).toEqual({ lat: 45.523, lng: -122.676 });

      expect(() => cleanup()).not.toThrow();
    });

    it('ignores geolocation updates if cancelled', () => {
      let savedSuccessCb;
      const getCurrentPosition = vi.fn((success) => {
        savedSuccessCb = success;
      });

      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition },
        writable: true,
        configurable: true,
      });

      const onFix = vi.fn();
      const cleanup = watchGps(onFix);

      // Cancel before geolocation fires
      cleanup();

      savedSuccessCb({
        coords: { latitude: 45.523, longitude: -122.676 },
      });

      expect(onFix).not.toHaveBeenCalled();
    });
  });

  describe('rankHotspots', () => {
    const mockHotspots = [
      { id: '1', lat: 45.5, lng: -122.6, land_type: 'public', minerals: ['Agate', 'Jasper'], trust_score: 0.9 },
      { id: '2', lat: 46.0, lng: -122.0, land_type: 'private', minerals: ['Agate'], trust_score: 0.5 },
      { id: '3', lat: 45.6, lng: -122.5, land_type: 'blm', minerals: ['Quartz'], trust_score: 0.8 },
    ];

    it('filters out invalid hotspots without lat/lng', () => {
      const hotspots = [...mockHotspots, { id: 'invalid', lat: null, lng: -122.6 }];
      const ranked = rankHotspots(hotspots);
      expect(ranked).toHaveLength(3);
    });

    it('ranks closer public land hotspots higher', () => {
      const userLocation = { lat: 45.5, lng: -122.6 };
      const ranked = rankHotspots(mockHotspots, { userLocation });

      expect(ranked[0].id).toBe('1');
      expect(ranked[0].distanceMi).toBeCloseTo(0);
    });

    it('calculates gapCount based on uncollected minerals', () => {
      const userLocation = { lat: 45.5, lng: -122.6 };
      const collectedMinerals = new Set(['agate']);
      const ranked = rankHotspots(mockHotspots, { userLocation, collectedMinerals });

      const h1 = ranked.find((h) => h.id === '1');
      expect(h1.gapCount).toBe(1); // 'Jasper' is uncollected
    });
  });

  describe('escapeHtml', () => {
    it('escapes special HTML characters', () => {
      expect(escapeHtml('<script>alert("xss & \'hello\'")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss &amp; &#39;hello&#39;&quot;)&lt;/script&gt;');
    });

    it('handles null, undefined, or empty values', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });
  });
});
