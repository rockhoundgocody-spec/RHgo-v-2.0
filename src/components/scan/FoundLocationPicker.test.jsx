import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: () => <div data-testid="circle-marker" />,
  useMap: () => ({ setView: vi.fn(), invalidateSize: vi.fn(), getZoom: () => 10 }),
  useMapEvents: () => {},
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Hotspot: { list: vi.fn().mockResolvedValue([]) },
      Specimen: { update: vi.fn().mockResolvedValue({}) },
    },
  },
}));

import FoundLocationPicker from './FoundLocationPicker';

describe('FoundLocationPicker', () => {
  it('renders search input with aria-label and focus ring styling', () => {
    const html = renderToStaticMarkup(
      <FoundLocationPicker value={null} onChange={vi.fn()} />
    );

    expect(html).toContain('aria-label="Search collecting site or location"');
    expect(html).toContain('focus-within:ring-2');
    expect(html).toContain('focus-within:ring-[#9FE8D0]/60');
  });

  it('renders GPS button with aria-label and focus-visible styling', () => {
    const html = renderToStaticMarkup(
      <FoundLocationPicker value={null} onChange={vi.fn()} />
    );

    expect(html).toContain('aria-label="Use my GPS location"');
    expect(html).toContain('focus-visible:ring-[#9FE8D0]/60');
  });

  it('renders Map toggle button with aria-expanded and dynamic aria-label', () => {
    const html = renderToStaticMarkup(
      <FoundLocationPicker value={null} onChange={vi.fn()} />
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Pick location on map"');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('renders clear location button with aria-label when location is selected', () => {
    const html = renderToStaticMarkup(
      <FoundLocationPicker value={{ found_at: 'Quartz Mine', lat: 40.0, lng: -105.0 }} onChange={vi.fn()} />
    );

    expect(html).toContain('aria-label="Clear found location"');
    expect(html).toContain('Quartz Mine');
    expect(html).toContain('focus-visible:ring-2');
  });
});
