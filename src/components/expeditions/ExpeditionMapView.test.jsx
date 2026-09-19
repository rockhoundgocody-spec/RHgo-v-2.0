import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/useGoogleMapsScript', () => ({
  default: vi.fn(),
}));

import ExpeditionMapView from './ExpeditionMapView.jsx';
import useGoogleMapsScript from '@/lib/useGoogleMapsScript';

describe('ExpeditionMapView shared Maps loader states', () => {
  const specimen = {
    id: 's1',
    mineral_name: 'Amethyst',
    lat: 37.7749,
    lng: -122.4194,
    rarity: 'rare',
  };
  const hotspot = {
    id: 'h1',
    title: 'Crystal Cave',
    lat: 37.775,
    lng: -122.4195,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useGoogleMapsScript.mockReturnValue({ mapsReady: false, apiKey: null, loadError: false });
  });

  it('renders loading feedback while the shared hook has no API key', () => {
    const output = renderToStaticMarkup(
      <ExpeditionMapView specimens={[specimen]} hotspots={[hotspot]} />
    );

    expect(useGoogleMapsScript).toHaveBeenCalledOnce();
    expect(output).toContain('Loading map…');
  });

  it('gives the shared hook error state precedence over loading and empty states', () => {
    useGoogleMapsScript.mockReturnValue({ mapsReady: false, apiKey: null, loadError: true });

    const output = renderToStaticMarkup(<ExpeditionMapView specimens={[]} hotspots={[]} />);

    expect(output).toContain('role="alert"');
    expect(output).toContain('The expedition map could not load.');
    expect(output).not.toContain('Loading map…');
  });

  it('renders the empty state once a key exists but no valid pins remain', () => {
    useGoogleMapsScript.mockReturnValue({ mapsReady: false, apiKey: 'test-key', loadError: false });
    const invalidSpecimen = { ...specimen, lat: 91 };
    const invalidHotspot = { ...hotspot, lng: 181 };

    const output = renderToStaticMarkup(
      <ExpeditionMapView specimens={[invalidSpecimen]} hotspots={[invalidHotspot]} />
    );

    expect(output).toContain('No geo-tagged finds or visited hotspots yet.');
  });

  it('renders the map region and pin counts when the shared loader has a key', () => {
    useGoogleMapsScript.mockReturnValue({ mapsReady: true, apiKey: 'test-key', loadError: false });

    const output = renderToStaticMarkup(
      <ExpeditionMapView specimens={[specimen]} hotspots={[hotspot]} />
    );

    expect(output).toContain('aria-label="Map of expedition finds and visited hotspots"');
    expect(output).toContain('1 finds');
    expect(output).toContain('1 sites');
  });
});
