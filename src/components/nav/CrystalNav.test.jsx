import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';

beforeAll(() => {
  globalThis.document = { body: {} };
});

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
  };
});

vi.mock('react-dom', () => ({
  createPortal: (children) => children,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('@/lib/useKidMode', () => ({
  default: () => false,
}));

import CrystalNav from './CrystalNav';

describe('CrystalNav', () => {
  it('renders tab buttons with correct aria-current and focus-visible attributes', () => {
    const onTabClick = vi.fn();

    const element = CrystalNav({
      activeTab: 'explore',
      onTabClick,
      pathname: '/explore',
    });

    expect(element).toBeDefined();
    expect(element.type).toBe('nav');

    const buttons = element.props.children;
    expect(buttons).toHaveLength(5);

    // Tab 0: Home ('/') -> not active
    const homeBtn = buttons[0];
    expect(homeBtn.props['aria-label']).toBe('Home');
    expect(homeBtn.props['aria-current']).toBeUndefined();
    expect(homeBtn.props.className).toContain('focus-visible:ring-hud-cyan/50');

    // Tab 1: Map ('/explore') -> active
    const mapBtn = buttons[1];
    expect(mapBtn.props['aria-label']).toBe('Map');
    expect(mapBtn.props['aria-current']).toBe('page');
    expect(mapBtn.props.className).toContain('focus-visible:ring-hud-cyan/50');

    // Tab 2: Scan ('/scan') -> HeroScanButton wrapper component
    const heroWrapper = buttons[2];
    expect(heroWrapper.props.isActive).toBe(false);

    const scanElement = heroWrapper.type({ isActive: heroWrapper.props.isActive, onClick: heroWrapper.props.onClick });
    const motionButton = scanElement.props.children[0];
    expect(motionButton.props['aria-label']).toBe('Scan');
    expect(motionButton.props['aria-current']).toBeUndefined();
    expect(motionButton.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });

  it('sets aria-current on HeroScanButton when active', () => {
    const onTabClick = vi.fn();

    const element = CrystalNav({
      activeTab: 'scan',
      onTabClick,
      pathname: '/scan',
    });

    const heroWrapper = element.props.children[2];
    expect(heroWrapper.props.isActive).toBe(true);

    const scanElement = heroWrapper.type({ isActive: heroWrapper.props.isActive, onClick: heroWrapper.props.onClick });
    const motionButton = scanElement.props.children[0];
    expect(motionButton.props['aria-current']).toBe('page');
  });
});
