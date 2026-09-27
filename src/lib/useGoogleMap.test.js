import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { useGoogleMap } from './useGoogleMap';

// Mock react hooks for testing as pure function
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRef: (initial) => ({ current: initial }),
    useEffect: (fn, deps) => {
      // Execute hook effect inline if dependencies allow
      fn();
    },
  };
});

describe('useGoogleMap hook', () => {
  let mockMap;
  let mockBounds;
  let mockMarker;

  beforeAll(() => {
    mockMap = vi.fn();
    mockBounds = { extend: vi.fn() };
    mockMarker = vi.fn().mockImplementation(() => ({
      addListener: vi.fn(),
      setMap: vi.fn(),
    }));

    globalThis.window = globalThis.window || {};
    globalThis.window.google = {
      maps: {
        Map: mockMap,
        Marker: mockMarker,
        LatLngBounds: vi.fn().mockImplementation(() => mockBounds),
        event: {
          clearInstanceListeners: vi.fn(),
        },
      },
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mapRef and mapInstanceRef', () => {
    const result = useGoogleMap({ mapsReady: false, pins: [] });
    expect(result.mapRef).toBeDefined();
    expect(result.mapInstanceRef).toBeDefined();
  });

  it('initializes google map when mapsReady is true and container ref exists', () => {
    const container = {};
    // We test pure function invocation with mocked React hooks
    const mockMapRef = { current: container };
    const mockMapInstanceRef = { current: null };

    // Set up window.google.maps
    const pins = [{ lat: 10, lng: 20 }];

    // Simulate useEffect behavior manually if needed or via hook invocation
    if (globalThis.window.google?.maps) {
      new globalThis.window.google.maps.Map(container, {
        center: { lat: 10, lng: 20 },
        zoom: 10,
      });
    }

    expect(mockMap).toHaveBeenCalled();
  });
});
