import { describe, it, expect, vi } from 'vitest';

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  CircleMarker: () => null,
  Marker: () => null,
  Popup: () => null,
  Polyline: () => null,
  useMap: () => ({ flyTo: () => {} }),
}));
vi.mock('@/components/explore/ActivityHeatLayer.jsx', () => ({ default: () => null }));

vi.mock('leaflet', () => {
  const L = {
    Icon: {
      Default: {
        prototype: {
          _getIconUrl: () => {},
        },
        mergeOptions: () => {},
      },
    },
    divIcon: (opts) => ({ ...opts, _type: 'divIcon' }),
  };
  return {
    default: L,
    ...L,
  };
});

describe('HotspotMap icon caching', () => {
  it('returns exact same L.divIcon instance for identical hotspot icon parameters', async () => {
    const { makeHotspotIcon } = await import('./HotspotMap.jsx');
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

    expect(icon1).toBe(icon2);
  });

  it('returns different L.divIcon instances for different hotspot icon parameters', async () => {
    const { makeHotspotIcon } = await import('./HotspotMap.jsx');
    const params1 = {
      color: '#34d399',
      isActive: false,
      isGlowing: true,
      hasGap: false,
      difficulty: 'moderate',
      highContrast: false,
    };

    const params2 = {
      ...params1,
      isActive: true,
    };

    const icon1 = makeHotspotIcon(params1);
    const icon2 = makeHotspotIcon(params2);

    expect(icon1).not.toBe(icon2);
  });

  it('returns exact same L.divIcon instance for identical specimen icon parameters', async () => {
    const { makeSpecimenIcon } = await import('./HotspotMap.jsx');
    const icon1 = makeSpecimenIcon('rare', false);
    const icon2 = makeSpecimenIcon('rare', false);

    expect(icon1).toBe(icon2);

    const iconDiff = makeSpecimenIcon('rare', true);
    expect(icon1).not.toBe(iconDiff);
  });

  it('returns exact same L.divIcon instance for identical user icon parameters', async () => {
    const { makeUserIcon } = await import('./HotspotMap.jsx');
    const icon1 = makeUserIcon(false);
    const icon2 = makeUserIcon(false);

    expect(icon1).toBe(icon2);

    const iconDiff = makeUserIcon(true);
    expect(icon1).not.toBe(iconDiff);
  });
});
