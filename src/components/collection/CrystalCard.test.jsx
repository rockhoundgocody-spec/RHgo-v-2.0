import { vi, describe, it, expect } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCallback: (fn) => fn,
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
    useState: (initial) => [initial, vi.fn()],
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, style, ...props }) => (
    <a href={to} className={className} style={style} {...props}>
      {children}
    </a>
  ),
}));

import CrystalCard from './CrystalCard.jsx';

describe('CrystalCard', () => {
  const sampleSpecimen = {
    id: 'specimen-001',
    mineral_name: 'Beryl',
    rarity: 'rare',
    ai_confidence: 0.88,
    found_at: 'Emerald Mine, NC',
    found_date: '2026-02-10',
    image_url: 'https://example.com/beryl.jpg',
  };

  it('renders specimen details correctly with image and confidence', () => {
    const card = CrystalCard({ specimen: sampleSpecimen, index: 2 });
    expect(card).not.toBeNull();

    // Motion container transition delay check
    expect(card.props.transition.delay).toBe(0.1); // 2 * 0.05

    // Link navigation target
    const link = card.props.children;
    expect(link.props.to).toBe('/specimen/specimen-001');

    // Image rendering check
    const imageContainer = link.props.children[0];
    const image = imageContainer.props.children[0];
    expect(image.type).toBe('img');
    expect(image.props.src).toBe('https://example.com/beryl.jpg');
    expect(image.props.alt).toBe('Beryl');

    // Rarity label
    const rarityLabel = imageContainer.props.children[2].props.children.props.children;
    expect(rarityLabel).toBe('Rare');

    // Confidence badge
    const confidenceSpan = imageContainer.props.children[3].props.children.props.children;
    expect(confidenceSpan.join('')).toBe('88%');

    // Mineral name
    const infoContainer = link.props.children[1];
    const mineralName = infoContainer.props.children[0].props.children;
    expect(mineralName).toBe('Beryl');

    // Location
    const locationText = infoContainer.props.children[1].props.children[1].props.children;
    expect(locationText).toBe('Emerald Mine, NC');

    // Date
    const dateText = infoContainer.props.children[2].props.children[1];
    expect(dateText).toBe('2026-02-10');
  });

  it('renders fallback emoji when image_url is missing and Unknown for missing mineral_name', () => {
    const specimenNoImage = {
      id: 'specimen-002',
      rarity: 'legendary',
    };

    const card = CrystalCard({ specimen: specimenNoImage, index: 0 });

    const link = card.props.children;
    const imageContainer = link.props.children[0];

    // Fallback emoji
    const fallbackEmoji = imageContainer.props.children[0].props.children;
    expect(fallbackEmoji).toBe('💎');

    // Rarity label
    const rarityLabel = imageContainer.props.children[2].props.children.props.children;
    expect(rarityLabel).toBe('Legendary');

    // Fallback mineral name
    const infoContainer = link.props.children[1];
    const mineralName = infoContainer.props.children[0].props.children;
    expect(mineralName).toBe('Unknown');

    // No confidence badge rendered
    expect(imageContainer.props.children[3]).toBeFalsy();

    // No location or date rendered
    expect(infoContainer.props.children[1]).toBeFalsy();
    expect(infoContainer.props.children[2]).toBeFalsy();
  });

  it('handles unknown rarity level by falling back to common rarity styling', () => {
    const specimenUnknownRarity = {
      id: 'specimen-003',
      mineral_name: 'Quartz',
      rarity: 'mythic_unknown',
    };

    const card = CrystalCard({ specimen: specimenUnknownRarity, index: 1 });

    const link = card.props.children;
    const imageContainer = link.props.children[0];
    const rarityLabel = imageContainer.props.children[2].props.children.props.children;
    expect(rarityLabel).toBe('Common');
  });

  it('calculates animation transition delay based on index prop', () => {
    const card = CrystalCard({ specimen: sampleSpecimen, index: 4 });
    expect(card.props.transition.delay).toBe(0.2); // 4 * 0.05
  });
});
