import { describe, it, expect, beforeAll, vi } from 'vitest';

// Icon-cache unit tests do not mount a map; isolate the external rendering layer
// rather than partially emulating a browser and loading Leaflet's real DOM runtime.
vi.mock('react-leaflet', () => ({
  MapContainer: () => null, TileLayer: () => null, Marker: () => null,
  Popup: () => null, Polyline: () => null, useMap: vi.fn(),
}));
vi.mock('leaflet/dist/leaflet.css', () => ({ default: {} }));
vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: () => {},
      },
    },
    divIcon: (opts) => ({ type: 'divIcon', ...opts }),
  },
}));

describe('HotspotMap icon caching', () => {
  let getHotspotIcon, getSpecimenIcon, getUserIcon;

  beforeAll(async () => {
    const module = await import('./HotspotMap.jsx');
    getHotspotIcon = module.getHotspotIcon;
    getSpecimenIcon = module.getSpecimenIcon;
    getUserIcon = module.getUserIcon;
  });

  it('returns the exact same L.divIcon reference for identical hotspot icon parameters', () => {
    const params = {
      color: '#34d399',
      isActive: false,
      isGlowing: false,
      hasGap: false,
      difficulty: 'easy',
      highContrast: false,
    };

    const icon1 = getHotspotIcon(params);
    const icon2 = getHotspotIcon(params);

    expect(icon1).toBeDefined();
    expect(icon1).toBe(icon2);
  });

  it('returns different L.divIcon references for distinct hotspot icon parameters', () => {
    const icon1 = getHotspotIcon({
      color: '#34d399',
      isActive: false,
      isGlowing: false,
      hasGap: false,
      difficulty: 'easy',
      highContrast: false,
    });

    const icon2 = getHotspotIcon({
      color: '#34d399',
      isActive: true, // active changed
      isGlowing: false,
      hasGap: false,
      difficulty: 'easy',
      highContrast: false,
    });

    expect(icon1).not.toBe(icon2);
  });

  it('returns the exact same L.divIcon reference for identical specimen icon parameters', () => {
    const icon1 = getSpecimenIcon('legendary', false);
    const icon2 = getSpecimenIcon('legendary', false);

    expect(icon1).toBeDefined();
    expect(icon1).toBe(icon2);
  });

  it('returns different L.divIcon references when specimen contrast or rarity changes', () => {
    const icon1 = getSpecimenIcon('rare', false);
    const icon2 = getSpecimenIcon('rare', true);

    expect(icon1).not.toBe(icon2);
  });

  it('returns the exact same L.divIcon reference for identical user icon parameters', () => {
    const icon1 = getUserIcon(false);
    const icon2 = getUserIcon(false);

    expect(icon1).toBeDefined();
    expect(icon1).toBe(icon2);
  });
});