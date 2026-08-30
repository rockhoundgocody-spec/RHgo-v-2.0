import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.hoisted(() => {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      self: {},
      top: {},
      location: { search: '', href: '', pathname: '' },
    };
  }
});

import React from 'react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/useBadgeAwarder', () => ({
  useBadgeAwarder: () => ({
    earnedCodes: new Set(['b1', 'b2']),
    allBadges: [
      { code: 'b1', title: 'Quartz Scout' },
      { code: 'b2', title: 'Agate Collector' },
    ],
  }),
}));

vi.mock('./LiquidMineralBadge.jsx', () => ({
  default: () => <div data-testid="liquid-mineral-badge" />,
}));

import ProfileBadgeStrip from './ProfileBadgeStrip.jsx';

describe('ProfileBadgeStrip component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with button role, tabIndex, aria-label, and focus-visible styles', () => {
    const tree = ProfileBadgeStrip();
    expect(tree).toBeDefined();
    expect(tree.props.role).toBe('button');
    expect(tree.props.tabIndex).toBe(0);
    expect(tree.props['aria-label']).toBe('View all earned badges');
    expect(tree.props.className).toContain('focus-visible:ring-2');
    expect(tree.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });

  it('navigates to /badges on click', () => {
    const tree = ProfileBadgeStrip();
    tree.props.onClick();
    expect(mockNavigate).toHaveBeenCalledWith('/badges');
  });

  it('navigates to /badges on Enter key press and prevents default', () => {
    const tree = ProfileBadgeStrip();
    const preventDefault = vi.fn();
    tree.props.onKeyDown({ key: 'Enter', preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/badges');
  });

  it('navigates to /badges on Space key press and prevents default', () => {
    const tree = ProfileBadgeStrip();
    const preventDefault = vi.fn();
    tree.props.onKeyDown({ key: ' ', preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/badges');
  });

  it('does not navigate on other key presses', () => {
    const tree = ProfileBadgeStrip();
    const preventDefault = vi.fn();
    tree.props.onKeyDown({ key: 'Tab', preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
