import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet', () => {
  const divIcon = (opts) => ({ ...opts, _isDivIcon: true });
  return {
    default: {
      divIcon,
      Icon: {
        Default: {
          prototype: { _getIconUrl: vi.fn() },
          mergeOptions: vi.fn(),
        },
      },
    },
  };
});
vi.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Polyline: () => null,
  useMap: () => ({ flyTo: vi.fn() }),
}));

describe('HotspotMap icon caching', () => {
  let makeHotspotIcon, makeSpecimenIcon, makeUserIcon;

  beforeAll(async () => {
    if (typeof globalThis.window === 'undefined') {
      const docMock = {
        createElement: () => ({
          style: {},
          setAttribute: () => {},
          removeAttribute: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
        }),
        documentElement: { style: {} },
      };
      const windowMock = {
        navigator: { userAgent: 'node' },
        document: docMock,
        screen: { deviceXDPI: 0, logicalXDPI: 0 },
      };
      globalThis.window = windowMock;
      globalThis.document = docMock;
    }

    const mod = await import('./HotspotMap.jsx');
    makeHotspotIcon = mod.makeHotspotIcon;
    makeSpecimenIcon = mod.makeSpecimenIcon;
    makeUserIcon = mod.makeUserIcon;
  });

  it('returns cached, reference-equal L.divIcon objects for identical hotspot parameters', () => {
    const params = {
      color: '#34d399',
      isActive: false,
      isGlowing: false,
      hasGap: false,
      difficulty: 'easy',
      highContrast: false,
    };

    const icon1 = makeHotspotIcon(params);
    const icon2 = makeHotspotIcon(params);

    expect(icon1).toBeDefined();
    expect(icon2).toBeDefined();
    expect(icon1).toBe(icon2); // Strict reference equality
  });

  it('returns distinct L.divIcon objects when hotspot properties differ', () => {
    const params1 = {
      color: '#34d399',
      isActive: false,
      isGlowing: false,
      hasGap: false,
      difficulty: 'easy',
      highContrast: false,
    };

    const params2 = {
      ...params1,
      isActive: true, // active state changed
    };

    const icon1 = makeHotspotIcon(params1);
    const icon2 = makeHotspotIcon(params2);

    expect(icon1).not.toBe(icon2);
  });

  it('returns cached, reference-equal L.divIcon objects for specimen icons', () => {
    const icon1 = makeSpecimenIcon('rare', false);
    const icon2 = makeSpecimenIcon('rare', false);
    const icon3 = makeSpecimenIcon('rare', true);

    expect(icon1).toBe(icon2);
    expect(icon1).not.toBe(icon3);
  });

  it('returns cached, reference-equal L.divIcon objects for user location icon', () => {
    const icon1 = makeUserIcon(false);
    const icon2 = makeUserIcon(false);
    const icon3 = makeUserIcon(true);

    expect(icon1).toBe(icon2);
    expect(icon1).not.toBe(icon3);
  });
});
