import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// Mock react's useMemo so component functions can be invoked directly without React DOM
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (factory) => factory(),
  };
});

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock LiquidMineralBadge
vi.mock('./LiquidMineralBadge.jsx', () => ({
  default: ({ badge, size }) => <div data-testid={`badge-${badge.code}`}>{badge.title} ({size})</div>,
}));

const mockEarnedCodes = new Set(['b1', 'b2', 'b3', 'b4']);
const mockAllBadges = [
  { code: 'b1', title: 'Common Badge', rarity: 'common' },
  { code: 'b2', title: 'Legendary Badge', rarity: 'legendary' },
  { code: 'b3', title: 'Rare Badge', rarity: 'rare' },
  { code: 'b4', title: 'Epic Badge', rarity: 'epic' },
  { code: 'b5', title: 'Unearned Legendary', rarity: 'legendary' },
];

vi.mock('@/lib/useBadgeAwarder', () => ({
  useBadgeAwarder: () => ({
    earnedCodes: mockEarnedCodes,
    allBadges: mockAllBadges,
  }),
}));

import Top3BadgesStrip from './Top3BadgesStrip.jsx';

describe('Top3BadgesStrip', () => {
  it('renders top 3 earned badges sorted by rarity (legendary, epic, rare)', () => {
    const element = Top3BadgesStrip();
    expect(element).toBeDefined();
    expect(element.type).toBe('div');

    const buttonRow = element.props.children[0];
    const buttons = buttonRow.props.children;
    expect(buttons).toHaveLength(3);

    // Slot 0 should be legendary (b2)
    // Slot 1 should be epic (b4)
    // Slot 2 should be rare (b3)
    const slot0Badge = buttons[0].props.children[0].props.children.props.badge;
    const slot1Badge = buttons[1].props.children[0].props.children.props.badge;
    const slot2Badge = buttons[2].props.children[0].props.children.props.badge;

    expect(slot0Badge.code).toBe('b2');
    expect(slot0Badge.rarity).toBe('legendary');

    expect(slot1Badge.code).toBe('b4');
    expect(slot1Badge.rarity).toBe('epic');

    expect(slot2Badge.code).toBe('b3');
    expect(slot2Badge.rarity).toBe('rare');
  });

  it('renders footer link with total achievements count', () => {
    const element = Top3BadgesStrip();
    const footerButton = element.props.children[1];
    expect(footerButton.props.children[1]).toBe(5);
  });
});
