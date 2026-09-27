// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PUBLIC_LAND,
  haversineMi,
  formatDistance,
  persistLastGps,
  readLastGps,
  watchGps,
  rankHotspots,
  escapeHtml,
} from './geo.js';

describe('geo utilities', () => {
  describe('PUBLIC_LAND', () => {
    it('contains expected public land categories', () => {
      expect(PUBLIC_LAND.has('public')).toBe(true);
      expect(PUBLIC_LAND.has('blm')).toBe(true);
      expect(PUBLIC_LAND.has('forest_service')).toBe(true);
      expect(PUBLIC_LAND.has('state_park')).toBe(true);
      expect(PUBLIC_LAND.has('private')).toBe(false);
    });
  });

  describe('haversineMi', () => {
    it('returns null when points or coordinates are missing or null', () => {
      expect(haversineMi(null, { lat: 40, lng: -70 })).toBeNull();
      expect(haversineMi({ lat: 40, lng: -70 }, null)).toBeNull();
      expect(haversineMi({}, { lat: 40, lng: -70 })).toBeNull();
      expect(haversineMi({ lat: null, lng: -70 }, { lat: 40, lng: -70 })).toBeNull();
      expect(haversineMi({ lat: 40, lng: undefined }, { lat: 40, lng: -70 })).toBeNull();
    });

    it('returns 0 for identical coordinates', () => {
      const point = { lat: 37.7749, lng: -122.4194 };
      expect(haversineMi(point, point)).toBe(0);
    });

    it('calculates accurate distance between known locations', () => {
      // San Francisco to Los Angeles is approx 347-350 miles
      const sf = { lat: 37.7749, lng: -122.4194 };
      const la = { lat: 34.0522, lng: -118.2437 };
      const dist = haversineMi(sf, la);
      expect(dist).toBeGreaterThan(340);
      expect(dist).toBeLessThan(360);
    });
  });

  describe('formatDistance', () => {
    it('returns null for null, undefined, or NaN inputs', () => {
      expect(formatDistance(null)).toBeNull();
      expect(formatDistance(undefined)).toBeNull();
      expect(formatDistance(NaN)).toBeNull();
    });

    it('formats distances less than 0.1 mi', () => {
      expect(formatDistance(0.05)).toBe('<0.1 mi');
      expect(formatDistance(0)).toBe('<0.1 mi');
      expect(formatDistance(-1)).toBe('<0.1 mi');
    });

    it('formats distances between 0.1 mi and 10 mi with 1 decimal place', () => {
      expect(formatDistance(0.1)).toBe('0.1 mi');
      expect(formatDistance(4.567)).toBe('4.6 mi');
      expect(formatDistance(9.94)).toBe('9.9 mi');
    });

    it('formats distances of 10 mi or greater rounded to nearest integer', () => {
      expect(formatDistance(10)).toBe('10 mi');
      expect(formatDistance(10.2)).toBe('10 mi');
      expect(formatDistance(15.6)).toBe('16 mi');
      expect(formatDistance(100)).toBe('100 mi');
    });
  });

  describe('persistLastGps & readLastGps', () => {
    beforeEach(() => {
      sessionStorage.clear();
      vi.restoreAllMocks();
    });

    it('persists and reads valid GPS coordinates', () => {
      const coords = { lat: 45.5, lng: -122.6 };
      persistLastGps(coords);

      const cached = readLastGps();
      expect(cached).toEqual({ lat: 45.5, lng: -122.6 });
    });

    it('ignores invalid coordinate inputs in persistLastGps', () => {
      persistLastGps(null);
      expect(readLastGps()).toBeNull();

      persistLastGps({ lat: 'invalid', lng: -122.6 });
      expect(readLastGps()).toBeNull();

      persistLastGps({ lat: 91, lng: -122.6 }); // out of bounds
      expect(readLastGps()).toBeNull();

      persistLastGps({ lat: 45.5, lng: 181 }); // out of bounds
      expect(readLastGps()).toBeNull();
    });

    it('returns null if stored data exceeds maxAgeMs in readLastGps', () => {
      const coords = { lat: 45.5, lng: -122.6 };
      persistLastGps(coords);

      // Advance time beyond 1 hour max age
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now + 1000 * 60 * 60 * 2);

      expect(readLastGps(1000 * 60 * 60)).toBeNull();
    });

    it('returns null if stored data is corrupted JSON or missing properties', () => {
      sessionStorage.setItem('rhgo_last_gps', 'invalid-json');
      expect(readLastGps()).toBeNull();

      sessionStorage.setItem('rhgo_last_gps', JSON.stringify({ lat: 'not-a-number', lng: -122.6 }));
      expect(readLastGps()).toBeNull();
    });

    it('gracefully handles sessionStorage errors', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(() => persistLastGps({ lat: 45.5, lng: -122.6 })).not.toThrow();
      expect(readLastGps()).toBeNull();
    });
  });

  describe('watchGps', () => {
    beforeEach(() => {
      sessionStorage.clear();
      vi.restoreAllMocks();
    });

    it('returns no-op function if onFix is not a function', () => {
      const unsub = watchGps(null);
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });

    it('calls onFix immediately if cached GPS exists', () => {
      persistLastGps({ lat: 45.5, lng: -122.6 });
      const onFix = vi.fn();

      watchGps(onFix);
      expect(onFix).toHaveBeenCalledWith({ lat: 45.5, lng: -122.6 });
    });

    it('requests position from navigator.geolocation when available', () => {
      const getCurrentPositionMock = vi.fn((success) => {
        success({ coords: { latitude: 40.7128, longitude: -74.006 } });
      });

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: getCurrentPositionMock,
        },
      });

      const onFix = vi.fn();
      watchGps(onFix);

      expect(getCurrentPositionMock).toHaveBeenCalled();
      expect(onFix).toHaveBeenCalledWith({ lat: 40.7128, lng: -74.006 });
      expect(readLastGps()).toEqual({ lat: 40.7128, lng: -74.006 });
    });

    it('respects cancellation when unsubscribed before geolocation callback fires', () => {
      let geoSuccessCallback;
      const getCurrentPositionMock = vi.fn((success) => {
        geoSuccessCallback = success;
      });

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: getCurrentPositionMock,
        },
      });

      const onFix = vi.fn();
      const unsub = watchGps(onFix);

      // Cancel before position callback is executed
      unsub();

      if (geoSuccessCallback) {
        geoSuccessCallback({ coords: { latitude: 40.7128, longitude: -74.006 } });
      }

      // onFix should not be called with the new geolocation fix
      expect(onFix).not.toHaveBeenCalled();
    });
  });

  describe('rankHotspots', () => {
    it('returns an empty array when hotspots input is null or undefined', () => {
      expect(rankHotspots(null)).toEqual([]);
      expect(rankHotspots(undefined)).toEqual([]);
    });

    it('filters out hotspots without numeric lat and lng', () => {
      const hotspots = [
        { name: 'Valid', lat: 45.0, lng: -122.0 },
        { name: 'No Lat', lng: -122.0 },
        { name: 'String Lat', lat: '45.0', lng: -122.0 },
      ];

      const ranked = rankHotspots(hotspots);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].name).toBe('Valid');
    });

    it('calculates huntScore based on distance, land type bonus, mineral gaps, and trust score', () => {
      const hotspots = [
        {
          name: 'Public Hotspot',
          lat: 45.0,
          lng: -122.0,
          land_type: 'blm', // +18 bonus
          minerals: ['Agate', 'Jasper'], // 2 gaps (+8)
          trust_score: 0.8, // trust * 20 = 16
        },
        {
          name: 'Private Hotspot',
          lat: 45.0,
          lng: -122.0,
          land_type: 'private', // -12 penalty
          minerals: ['Quartz'], // 1 gap (+4)
          trust_score: 0.5, // trust * 20 = 10
        },
      ];

      const ranked = rankHotspots(hotspots, {
        collectedMinerals: new Set(['quartz']),
      });

      expect(ranked[0].name).toBe('Public Hotspot');
      expect(ranked[0].gapCount).toBe(2);
      expect(ranked[1].gapCount).toBe(0); // Quartz is already collected
    });

    it('accepts collectedMinerals as an Array or Set and handles case-insensitivity', () => {
      const hotspots = [
        { name: 'Site A', lat: 45.0, lng: -122.0, minerals: ['AMETHYST', 'Calcite'] },
      ];

      const rankedWithArray = rankHotspots(hotspots, {
        collectedMinerals: ['AMETHYST'],
      });
      expect(rankedWithArray[0].gapCount).toBe(1); // Only Calcite missing

      const rankedWithSet = rankHotspots(hotspots, {
        collectedMinerals: new Set(['amethyst']),
      });
      expect(rankedWithSet[0].gapCount).toBe(1);
    });

    it('sorts by distance when distance difference is greater than 2 miles', () => {
      const userLocation = { lat: 45.0, lng: -122.0 };
      const hotspots = [
        { name: 'Farther', lat: 45.5, lng: -122.0 }, // ~34.5 miles
        { name: 'Closer', lat: 45.01, lng: -122.0 }, // ~0.69 miles
      ];

      const ranked = rankHotspots(hotspots, { userLocation });
      expect(ranked[0].name).toBe('Closer');
      expect(ranked[1].name).toBe('Farther');
    });

    it('sorts by huntScore when distance difference is 2 miles or less', () => {
      const userLocation = { lat: 45.0, lng: -122.0 };
      const hotspots = [
        {
          name: 'High Score Slightly Farther',
          lat: 45.01, // ~0.69 mi
          lng: -122.0,
          land_type: 'public', // +18 bonus
          trust_score: 1.0,
        },
        {
          name: 'Low Score Slightly Closer',
          lat: 45.005, // ~0.35 mi (distance diff is ~0.34 mi <= 2 mi)
          lng: -122.0,
          land_type: 'private', // -12 penalty
          trust_score: 0.1,
        },
      ];

      const ranked = rankHotspots(hotspots, { userLocation });
      expect(ranked[0].name).toBe('High Score Slightly Farther');
    });
  });

  describe('escapeHtml', () => {
    it('escapes special HTML characters', () => {
      expect(escapeHtml('<div>"Hello" & \'World\'</div>')).toBe(
        '&lt;div&gt;&quot;Hello&quot; &amp; &#39;World&#39;&lt;/div&gt;'
      );
    });

    it('returns empty string for null or undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('leaves safe strings unchanged', () => {
      expect(escapeHtml('Rockhound123')).toBe('Rockhound123');
    });
  });
});
