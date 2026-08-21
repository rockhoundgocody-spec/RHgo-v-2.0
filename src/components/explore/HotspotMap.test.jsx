import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('leaflet/dist/leaflet.css', () => ({}));

vi.mock('leaflet', () => {
  return {
    default: {
      divIcon: vi.fn((opts) => ({ ...opts, _isDivIcon: true })),
      Icon: {
        Default: {
          prototype: {},
          mergeOptions: vi.fn(),
        },
      },
    },
  };
});

describe('HotspotMap icon caching optimization', () => {
  let makeHotspotIcon, makeSpecimenIcon, makeUserIcon, hotspotIconCache, specimenIconCache, userIconCache;

  beforeAll(async () => {
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = {
        screen: {},
        navigator: { userAgent: 'node' },
        addEventListener: () => {},
        removeEventListener: () => {},
      };
      globalThis.document = {
        createElement: () => ({ style: {} }),
        documentElement: { style: {} },
      };
    }

    const mod = await import('./HotspotMap.jsx');
    makeHotspotIcon = mod.makeHotspotIcon;
    makeSpecimenIcon = mod.makeSpecimenIcon;
    makeUserIcon = mod.makeUserIcon;
    hotspotIconCache = mod.hotspotIconCache;
    specimenIconCache = mod.specimenIconCache;
    userIconCache = mod.userIconCache;
  });

  beforeEach(() => {
    hotspotIconCache.clear();
    specimenIconCache.clear();
    userIconCache.clear();
  });

  describe('makeHotspotIcon', () => {
    it('returns the exact same L.divIcon instance for identical parameters', () => {
      const params = {
        color: '#34d399',
        isActive: false,
        isGlowing: true,
        hasGap: false,
        difficulty: 'moderate',
        highContrast: false,
      };

      const icon1 = makeHotspotIcon(params);
      const icon2 = makeHotspotIcon(params);

      expect(hotspotIconCache.size).toBe(1);
      expect(icon1).toBe(icon2);
    });

    it('returns different L.divIcon instances for different visual properties', () => {
      const iconActive = makeHotspotIcon({
        color: '#34d399',
        isActive: true,
        isGlowing: false,
        hasGap: false,
        difficulty: 'easy',
        highContrast: false,
      });

      const iconInactive = makeHotspotIcon({
        color: '#34d399',
        isActive: false,
        isGlowing: false,
        hasGap: false,
        difficulty: 'easy',
        highContrast: false,
      });

      expect(hotspotIconCache.size).toBe(2);
      expect(iconActive).not.toBe(iconInactive);
    });
  });

  describe('makeSpecimenIcon', () => {
    it('caches specimen icons by rarity and highContrast state', () => {
      const spec1 = makeSpecimenIcon('rare', false);
      const spec2 = makeSpecimenIcon('rare', false);
      const specLegendary = makeSpecimenIcon('legendary', false);

      expect(specimenIconCache.size).toBe(2);
      expect(spec1).toBe(spec2);
      expect(spec1).not.toBe(specLegendary);
    });
  });

  describe('makeUserIcon', () => {
    it('caches user icon by highContrast state', () => {
      const user1 = makeUserIcon(false);
      const user2 = makeUserIcon(false);
      const userHC = makeUserIcon(true);

      expect(userIconCache.size).toBe(2);
      expect(user1).toBe(user2);
      expect(user1).not.toBe(userHC);
    });
  });
});
