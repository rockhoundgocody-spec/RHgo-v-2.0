import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/useGoogleMapsScript', () => ({
  default: vi.fn(),
}));

import CollectionMap from './CollectionMap.jsx';
import useGoogleMapsScript from '@/lib/useGoogleMapsScript';

describe('CollectionMap shared Maps loader states', () => {
  const specimen = {
    id: 's1',
    mineral_name: 'Quartz',
    lat: 37.7749,
    lng: -122.4194,
    rarity: 'rare',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useGoogleMapsScript.mockReturnValue({ mapsReady: false, apiKey: null, loadError: false });
  });

  it('renders loading feedback while the shared hook has no API key', () => {
    const output = renderToStaticMarkup(<CollectionMap specimens={[specimen]} />);

    expect(useGoogleMapsScript).toHaveBeenCalledOnce();
    expect(output).toContain('Loading map…');
  });

  it('gives the shared hook error state precedence over loading and empty states', () => {
    useGoogleMapsScript.mockReturnValue({ mapsReady: false, apiKey: null, loadError: true });

    const output = renderToStaticMarkup(<CollectionMap specimens={[]} />);

    expect(output).toContain('role="alert"');
    expect(output).toContain('The collection map could not load.');
    expect(output).not.toContain('Loading map…');
  });

  it('renders the empty state once a key exists but no valid specimens remain', () => {
    useGoogleMapsScript.mockReturnValue({ mapsReady: false, apiKey: 'test-key', loadError: false });
    const invalidSpecimen = { ...specimen, lat: Number.NaN };

    const output = renderToStaticMarkup(<CollectionMap specimens={[invalidSpecimen]} />);

    expect(output).toContain('No geo-tagged finds yet.');
  });

  it('renders the map region and pin count when the shared loader has a key', () => {
    useGoogleMapsScript.mockReturnValue({ mapsReady: true, apiKey: 'test-key', loadError: false });

    const output = renderToStaticMarkup(<CollectionMap specimens={[specimen]} />);

    expect(output).toContain('aria-label="Map of geo-tagged specimens"');
    expect(output).toContain('1 pin');
    expect(output).not.toContain('1 pins');
  });
});
