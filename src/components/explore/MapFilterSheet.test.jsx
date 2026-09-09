import { describe, it, expect, vi, beforeAll } from 'vitest';

// Define window on globalThis before module imports evaluate
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    self: 1,
    top: 1,
    location: { href: 'http://localhost' },
  };
}

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (init) => [typeof init === 'function' ? init() : init, vi.fn()],
    useMemo: (factory) => factory(),
    useCallback: (fn) => fn,
    useId: () => ':r0:',
  };
});

let MapFilterSheet;

beforeAll(async () => {
  const module = await import('./MapFilterSheet');
  MapFilterSheet = module.default;
});

describe('MapFilterSheet', () => {
  it('returns null / hidden when open is false', () => {
    const tree = MapFilterSheet({ open: false, selectedMinerals: new Set() });
    expect(tree.props.children).toBeFalsy();
  });

  it('renders dialog with correct ARIA attributes when open is true', () => {
    const handleClose = vi.fn();
    const tree = MapFilterSheet({
      open: true,
      onClose: handleClose,
      activeLayer: 'all',
      selectedMinerals: new Set(),
      onLayerChange: vi.fn(),
      onToggleMineral: vi.fn(),
      onClearMinerals: vi.fn(),
      minerals: ['quartz', 'agate'],
    });

    expect(tree).not.toBeNull();
    const [backdrop, sheet] = tree.props.children.props.children;

    // Check dialog container props
    expect(sheet.props.role).toBe('dialog');
    expect(sheet.props['aria-modal']).toBe('true');
    expect(sheet.props['aria-labelledby']).toBe('map-filter-sheet-title');
  });

  it('calls onLayerChange when an access or spot option is clicked', () => {
    const handleLayerChange = vi.fn();
    const tree = MapFilterSheet({
      open: true,
      onClose: vi.fn(),
      activeLayer: 'all',
      selectedMinerals: new Set(),
      onLayerChange: handleLayerChange,
      onToggleMineral: vi.fn(),
      onClearMinerals: vi.fn(),
      minerals: ['quartz'],
    });

    const sheet = tree.props.children.props.children[1];
    const scrollContent = sheet.props.children[2];
    const accessSection = scrollContent.props.children[0];
    const publicLandOption = accessSection.props.children[1]; // ACCESS_OPTIONS[1]

    expect(publicLandOption.props.active).toBe(false);
    publicLandOption.props.onClick();
    expect(handleLayerChange).toHaveBeenCalledWith('public');
  });

  it('calls onToggleMineral with mineral name when clicked', () => {
    const handleToggleMineral = vi.fn();
    const tree = MapFilterSheet({
      open: true,
      onClose: vi.fn(),
      activeLayer: 'all',
      selectedMinerals: new Set(['quartz']),
      onLayerChange: vi.fn(),
      onToggleMineral: handleToggleMineral,
      onClearMinerals: vi.fn(),
      minerals: ['quartz', 'agate'],
    });

    const sheet = tree.props.children.props.children[1];
    const scrollContent = sheet.props.children[2];
    const rocksSection = scrollContent.props.children[2];
    const mineralButtons = rocksSection.props.children[1].props.children[0]; // quartz button

    expect(mineralButtons[0].props['aria-pressed']).toBe(true);
    expect(mineralButtons[1].props['aria-pressed']).toBe(false);

    mineralButtons[1].props.onClick();
    expect(handleToggleMineral).toHaveBeenCalledWith('agate');
  });

  it('calls resetAll when Reset button is clicked', () => {
    const handleLayerChange = vi.fn();
    const handleClearMinerals = vi.fn();
    const tree = MapFilterSheet({
      open: true,
      onClose: vi.fn(),
      activeLayer: 'public',
      selectedMinerals: new Set(['quartz']),
      onLayerChange: handleLayerChange,
      onToggleMineral: vi.fn(),
      onClearMinerals: handleClearMinerals,
      minerals: ['quartz'],
    });

    const sheet = tree.props.children.props.children[1];
    const header = sheet.props.children[0];
    const resetButton = header.props.children[1].props.children[1].props.children[0];

    resetButton.props.onClick();
    expect(handleLayerChange).toHaveBeenCalledWith('all');
    expect(handleClearMinerals).toHaveBeenCalled();
  });
});
