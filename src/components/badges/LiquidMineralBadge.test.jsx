import { vi, describe, it, expect } from 'vitest';

// Set up window before any dynamic imports
const dummyObj = {};
globalThis.window = {
  location: { search: '', href: '', pathname: '' },
  self: dummyObj,
  top: dummyObj,
};

// Mock react to evaluate useMemo immediately if needed
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useMemo: (factory) => factory(),
  };
});

describe('LiquidMineralBadge', () => {
  const sampleBadge = {
    id: 'badge-1',
    title: 'Amethyst Master',
    colorScheme: 'amethyst',
    rarity: 'rare',
    icon: 'Gem',
    material: 'liquid_glass',
  };

  it('renders a React element with default props', async () => {
    const { default: LiquidMineralBadge } = await import('./LiquidMineralBadge.jsx');
    const element = LiquidMineralBadge({ badge: sampleBadge });
    expect(element).toBeDefined();
    expect(element.type).toBe('div');
    expect(element.props.className).toContain('relative flex flex-col items-center select-none');
  });

  it('handles custom size, locked state, and showLabel', async () => {
    const { default: LiquidMineralBadge } = await import('./LiquidMineralBadge.jsx');
    const element = LiquidMineralBadge({
      badge: sampleBadge,
      size: 100,
      locked: true,
      showLabel: true,
    });

    expect(element).toBeDefined();
    // Verify width calculation: totalSize = size + rarityConf.rings * 22 (for rare: 1 ring -> 100 + 22 = 122)
    expect(element.props.style.width).toBe(122);
  });

  it('renders legendary badge with spinning outer ring when unlocked', async () => {
    const { default: LiquidMineralBadge } = await import('./LiquidMineralBadge.jsx');
    const legendaryBadge = {
      ...sampleBadge,
      rarity: 'legendary',
    };

    const element = LiquidMineralBadge({
      badge: legendaryBadge,
      size: 120,
      locked: false,
    });

    expect(element).toBeDefined();
    // Legendary rarity has 2 rings -> totalSize = 120 + 2 * 22 = 164
    expect(element.props.style.width).toBe(164);
  });

  it('exports valid COLOR_SCHEMES and MATERIAL_DEFS', async () => {
    const { COLOR_SCHEMES, MATERIAL_DEFS } = await import('./LiquidMineralBadge.jsx');
    expect(COLOR_SCHEMES.amethyst).toBeDefined();
    expect(COLOR_SCHEMES.gold).toBeDefined();
    expect(MATERIAL_DEFS.liquid_glass).toBeDefined();
    expect(MATERIAL_DEFS.natural_stone).toBeDefined();
  });
});
