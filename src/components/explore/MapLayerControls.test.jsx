import { describe, it, expect, vi, beforeAll } from 'vitest';

// Define window on globalThis before module imports evaluate src/lib/utils.js
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    self: 1,
    top: 1,
    location: { href: 'http://localhost' },
  };
}

let MapLayerControls;

describe('MapLayerControls', () => {
  beforeAll(async () => {
    const module = await import('./MapLayerControls');
    MapLayerControls = module.default;
  });

  const defaultLayers = {
    type: 'hybrid',
    tilt: false,
    blm: true,
    parcels: false,
    geology: false,
    cluster: true,
    traffic: false,
  };

  it('renders layer control buttons with correct aria-pressed attributes', () => {
    const handleChange = vi.fn();
    const element = MapLayerControls({ layers: defaultLayers, onChange: handleChange });

    expect(element).toBeDefined();

    // Outer container has children: 1st hud panel (map types + tilt), 2nd hud panel (data layers), 3rd hud panel (navigation if canNavigate)
    const [mapTypesPanel, dataLayersPanel] = element.props.children;

    // In mapTypesPanel, children are TYPES.map (4 chips) + divider + tilt Chip
    const [typesArray, , tiltChip] = mapTypesPanel.props.children;

    const hybridChip = typesArray[0];
    const satelliteChip = typesArray[1];

    expect(hybridChip.props.active).toBe(true);
    expect(satelliteChip.props.active).toBe(false);
    expect(tiltChip.props.active).toBe(false);

    // Render the Chip component directly to test its attributes
    const ChipComponent = hybridChip.type;
    const hybridRendered = ChipComponent(hybridChip.props);

    expect(hybridRendered.props.type).toBe('button');
    expect(hybridRendered.props['aria-pressed']).toBe(true);
    expect(hybridRendered.props.className).toContain('focus-visible:ring-2');
    expect(hybridRendered.props.className).toContain('focus-visible:ring-hud-cyan/60');

    // Test data layers panel chips
    const dataChipsArray = dataLayersPanel.props.children;
    const blmChipProps = dataChipsArray[0].props;
    const parcelsChipProps = dataChipsArray[1].props;

    expect(blmChipProps.active).toBe(true);
    expect(parcelsChipProps.active).toBe(false);

    const blmRendered = ChipComponent(blmChipProps);
    expect(blmRendered.props['aria-pressed']).toBe(true);
  });

  it('triggers onChange when layer button is clicked', () => {
    const handleChange = vi.fn();
    const element = MapLayerControls({ layers: defaultLayers, onChange: handleChange });

    const [mapTypesPanel] = element.props.children;
    const [typesArray] = mapTypesPanel.props.children;
    const satelliteChipProps = typesArray[1].props;

    satelliteChipProps.onClick();

    expect(handleChange).toHaveBeenCalledWith({
      ...defaultLayers,
      type: 'satellite',
    });
  });

  it('renders navigation controls when canNavigate is true', () => {
    const handleNavigate = vi.fn();
    const handleClear = vi.fn();

    const element = MapLayerControls({
      layers: defaultLayers,
      onChange: vi.fn(),
      canNavigate: true,
      onNavigate: handleNavigate,
      onClearRoute: handleClear,
    });

    const navPanel = element.props.children[2];
    expect(navPanel).toBeDefined();

    const [routeChipProps, clearChipProps] = navPanel.props.children.map((c) => c.props);

    routeChipProps.onClick();
    expect(handleNavigate).toHaveBeenCalled();

    clearChipProps.onClick();
    expect(handleClear).toHaveBeenCalled();
  });
});
