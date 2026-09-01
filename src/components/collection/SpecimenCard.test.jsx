import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => 'specimen-lore-id',
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

import SpecimenCard, {
  formatSpecimenNumber,
  getConfidenceDetails,
  calculateCollectionScore,
} from './SpecimenCard.jsx';

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
    expect(expandButton.props['aria-controls']).toBe('specimen-lore-id');
    expect(expandButton.props['aria-label']).toBe('Expand specimen lore');
    expect(expandButton.props.className).toContain('focus-visible:ring-2');
  });
});

describe('SpecimenCard Helpers', () => {
  describe('formatSpecimenNumber', () => {
    it('formats numbers with 3-digit zero padding', () => {
      expect(formatSpecimenNumber(0)).toBe('001');
      expect(formatSpecimenNumber(9)).toBe('010');
      expect(formatSpecimenNumber(99)).toBe('100');
    });
  });

  describe('getConfidenceDetails', () => {
    it('handles null or undefined confidence', () => {
      expect(getConfidenceDetails(null)).toEqual({
        purity: null,
        confLabel: null,
        confColor: '#94a3b8',
      });
      expect(getConfidenceDetails(undefined)).toEqual({
        purity: null,
        confLabel: null,
        confColor: '#94a3b8',
      });
    });

    it('returns correct label and color for high confidence threshold', () => {
      expect(getConfidenceDetails(0.9)).toEqual({
        purity: '90',
        confLabel: 'Near certain',
        confColor: '#34d399',
      });
    });

    it('returns correct label and color for moderate-high confidence threshold', () => {
      expect(getConfidenceDetails(0.75)).toEqual({
        purity: '75',
        confLabel: 'High confidence',
        confColor: '#38bdf8',
      });
    });

    it('returns correct label and color for moderate confidence threshold', () => {
      expect(getConfidenceDetails(0.6)).toEqual({
        purity: '60',
        confLabel: 'Moderate',
        confColor: '#fbbf24',
      });
    });

    it('returns correct label and color for low confidence threshold', () => {
      expect(getConfidenceDetails(0.4)).toEqual({
        purity: '40',
        confLabel: 'Needs field test',
        confColor: '#f87171',
      });
    });
  });

  describe('calculateCollectionScore', () => {
    it('returns placeholder when confidence is missing', () => {
      expect(calculateCollectionScore(null, 2)).toBe('—');
      expect(calculateCollectionScore(0, 2)).toBe('—');
    });

    it('calculates weighted score based on confidence and evolution level', () => {
      // (0.92 * 0.7 + (4 / 4) * 0.3) * 5 = (0.644 + 0.3) * 5 = 0.944 * 5 = 4.72 -> '4.7'
      expect(calculateCollectionScore(0.92, 4)).toBe('4.7');
    });
  });
});
