import { describe, expect, it, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (fn) => fn(),
  };
});

vi.mock('lucide-react', () => ({
  Filter: () => null,
  Mountain: () => null,
  MapPin: () => null,
  Navigation: () => null,
}));

import ExploreEmptyState from './ExploreEmptyState.jsx';

describe('ExploreEmptyState', () => {
  const userLoc = { lat: 37.7749, lng: -122.4194 }; // San Francisco

  const hotspots = [
    { id: 'h1', name: 'Far Spot', lat: 40.7128, lng: -74.0060, state: 'NY', land_type: 'public' }, // ~2500 mi
    { id: 'h2', name: 'Close Spot 1', lat: 37.7800, lng: -122.4200, state: 'CA', land_type: 'blm' }, // ~0.5 mi
    { id: 'h3', name: 'Close Spot 2', lat: 37.8000, lng: -122.4100, state: 'CA', land_type: 'state_park' }, // ~2 mi
    { id: 'h4', name: 'Close Spot 3', lat: 37.8500, lng: -122.4000, state: 'CA', land_type: 'forest_service' }, // ~5 mi
    { id: 'h5', name: 'Invalid Spot', lat: null, lng: -122.4194, state: 'CA', land_type: 'public' },
    { id: 'h6', name: 'Medium Spot', lat: 37.9000, lng: -122.3000, state: 'CA', land_type: 'private' }, // ~12 mi
  ];

  it('renders guidance cards when user location is missing', () => {
    const onAction = vi.fn();
    const result = ExploreEmptyState({
      hotspots,
      userLocation: null,
      onSelectHotspot: vi.fn(),
      onAction,
    });

    expect(result).toBeDefined();
    expect(result.props.children[0].props.children).toBe('Explore guide');
  });

  it('renders guidance cards when no hotspots are within 500 miles', () => {
    const farHotspots = [
      { id: 'far1', name: 'NY Spot', lat: 40.7128, lng: -74.0060 }, // NYC ~2500 mi
    ];

    const result = ExploreEmptyState({
      hotspots: farHotspots,
      userLocation: userLoc,
      onSelectHotspot: vi.fn(),
      onAction: vi.fn(),
    });

    expect(result.props.children[0].props.children).toBe('No verified spots nearby');
  });

  it('renders top 3 nearest valid spots in distance order when nearby spots exist', () => {
    const onSelectHotspot = vi.fn();
    const result = ExploreEmptyState({
      hotspots,
      userLocation: userLoc,
      onSelectHotspot,
      onAction: vi.fn(),
    });

    expect(result.props.children[0].props.children).toBe('Nearest verified spots');

    const buttonContainer = result.props.children[1];
    const buttons = buttonContainer.props.children;
    expect(buttons).toHaveLength(3);

    // Verify button 1 is h2 (nearest ~0.5 mi)
    expect(buttons[0].key).toBe('h2');
    // Verify button 2 is h3 (~2 mi)
    expect(buttons[1].key).toBe('h3');
    // Verify button 3 is h4 (~5 mi)
    expect(buttons[2].key).toBe('h4');
  });

  it('handles empty hotspots list gracefully', () => {
    const result = ExploreEmptyState({
      hotspots: [],
      userLocation: userLoc,
      onSelectHotspot: vi.fn(),
      onAction: vi.fn(),
    });

    expect(result.props.children[0].props.children).toBe('No verified spots nearby');
  });
});
