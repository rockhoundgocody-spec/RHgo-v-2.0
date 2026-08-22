import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, style, ...props }) =>
    React.createElement('a', { href: to, className, style, ...props }, children),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    analytics: {
      track: vi.fn(),
    },
  },
}));

import SpecimenCard from './SpecimenCard.jsx';

describe('SpecimenCard', () => {
  const mockSpecimen = {
    id: 'specimen-123',
    mineral_name: 'Amethyst Cluster',
    common_name: 'Purple Quartz',
    rarity: 'rare',
    ai_confidence: 0.92,
    verified: true,
    found_date: '2026-03-15',
    found_at: 'Thunder Bay, ON',
    image_url: 'https://example.com/amethyst.jpg',
    notes: 'Beautiful violet crystals with hematite inclusions.',
  };

  it('renders specimen information correctly with accessible attributes', () => {
    const card = SpecimenCard({ specimen: mockSpecimen, index: 0 });

    expect(card).toBeDefined();
    expect(card.props.to).toBe('/specimen/specimen-123');

    // Access core data container (children[4])
    const coreData = card.props.children[4];
    const [titleContainer, , , , , shareExpandRow] = coreData.props.children;

    // Title verification
    const [titleDiv] = titleContainer.props.children;
    expect(titleDiv.props.children).toBe('Amethyst Cluster');

    // Expand/Lore button verification
    const [, expandButton] = shareExpandRow.props.children;
    expect(expandButton.type).toBe('button');
    expect(expandButton.props['aria-expanded']).toBe(false);
    expect(expandButton.props['aria-label']).toBe('Expand specimen lore');
    expect(expandButton.props.className).toContain('focus-visible:ring-2');
  });
});
