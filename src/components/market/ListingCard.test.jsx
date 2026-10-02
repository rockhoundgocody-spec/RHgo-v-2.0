import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => React.createElement('button', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

import ListingCard from './ListingCard.jsx';

describe('ListingCard Accessibility', () => {
  const sampleListing = {
    id: 'listing-1',
    title: 'Amethyst Cluster',
    mineral_name: 'Amethyst',
    rarity: 'rare',
    asking_price: 45,
    location_label: 'Thunder Bay, ON',
    verified: true,
  };

  it('renders with button role, tabIndex={0}, focus-visible styles, and descriptive aria-label', () => {
    const card = ListingCard({ listing: sampleListing });

    expect(card.props.role).toBe('button');
    expect(card.props.tabIndex).toBe(0);
    expect(card.props.className).toContain('focus-visible:ring-2');
    expect(card.props.className).toContain('focus-visible:ring-amethyst-glow/60');
    expect(card.props['aria-label']).toBe('Amethyst Cluster, Rare rarity, $45, from Thunder Bay, ON');
  });

  it('handles keyboard activation when Enter or Space is pressed', () => {
    const onTapMock = vi.fn();
    const card = ListingCard({ listing: sampleListing, onTap: onTapMock });

    const enterEvent = { key: 'Enter', preventDefault: vi.fn() };
    card.props.onKeyDown(enterEvent);
    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(onTapMock).toHaveBeenCalledWith(sampleListing);

    const spaceEvent = { key: ' ', preventDefault: vi.fn() };
    card.props.onKeyDown(spaceEvent);
    expect(spaceEvent.preventDefault).toHaveBeenCalled();
    expect(onTapMock).toHaveBeenLastCalledWith(sampleListing);
  });

  it('renders correct price info in aria-label for trade-only listings', () => {
    const tradeListing = {
      ...sampleListing,
      trade_only: true,
      asking_price: 0,
    };
    const card = ListingCard({ listing: tradeListing });

    expect(card.props['aria-label']).toContain('Trade only');
  });
});
