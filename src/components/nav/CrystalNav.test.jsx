import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';

beforeAll(() => {
  globalThis.document = { body: {} };
});

vi.mock('react-dom', () => ({
  createPortal: (node) => node,
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => React.createElement('button', props, children),
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
}));

vi.mock('@/lib/useKidMode', () => ({
  default: () => false,
}));

import CrystalNav from './CrystalNav';

describe('CrystalNav Accessibility', () => {
  it('renders tab buttons with focus-visible ring classes and aria-current when active', () => {
    const onTabClick = vi.fn();
    const navElement = CrystalNav({
      activeTab: 'home',
      onTabClick,
      pathname: '/',
    });

    expect(navElement).toBeDefined();
    expect(navElement.type).toBe('nav');

    const tabs = navElement.props.children;
    expect(tabs.length).toBe(5);

    // First tab is Home ('/')
    const homeTab = tabs[0];
    expect(homeTab.props['aria-label']).toBe('Home');
    expect(homeTab.props['aria-current']).toBe('page');
    expect(homeTab.props.className).toContain('focus-visible:ring-2');
    expect(homeTab.props.className).toContain('focus-visible:ring-hud-cyan/80');

    // Second tab is Map ('/explore'), inactive
    const mapTab = tabs[1];
    expect(mapTab.props['aria-label']).toBe('Map');
    expect(mapTab.props['aria-current']).toBeUndefined();
    expect(mapTab.props.className).toContain('focus-visible:ring-2');

    // Middle tab is Scan ('/scan') - HeroScanButton wrapper component
    const heroScanWrapper = tabs[2];
    expect(heroScanWrapper.props.isActive).toBe(false);

    const heroScanBtn = heroScanWrapper.type(heroScanWrapper.props);
    // Find the motion.button inside HeroScanButton
    const heroButton = heroScanBtn.props.children[0];
    expect(heroButton.props['aria-label']).toBe('Scan');
    expect(heroButton.props['aria-current']).toBeUndefined();
    expect(heroButton.props.className).toContain('focus-visible:ring-2');
    expect(heroButton.props.className).toContain('focus-visible:ring-amethyst-glow/80');
  });

  it('sets aria-current="page" on HeroScanButton when on /scan route', () => {
    const onTabClick = vi.fn();
    const navElement = CrystalNav({
      activeTab: 'scan',
      onTabClick,
      pathname: '/scan',
    });

    const tabs = navElement.props.children;
    const heroScanWrapper = tabs[2];
    expect(heroScanWrapper.props.isActive).toBe(true);

    const heroScanBtn = heroScanWrapper.type(heroScanWrapper.props);
    const heroButton = heroScanBtn.props.children[0];
    expect(heroButton.props['aria-label']).toBe('Scan');
    expect(heroButton.props['aria-current']).toBe('page');
  });
});
