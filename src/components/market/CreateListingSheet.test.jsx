import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const prefillSpecimen = {
  id: 'specimen-1',
  mineral_name: 'Fluorite',
  rarity: 'rare',
  found_at: 'Cave-in-Rock, IL',
  image_url: 'https://example.com/fluorite.jpg',
};

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      // Return specimen list for specimens state when array is passed
      if (Array.isArray(initial)) return [[prefillSpecimen], vi.fn()];
      return [typeof initial === 'function' ? initial() : initial, vi.fn()];
    },
    useMemo: (factory) => factory(),
    useEffect: vi.fn(),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn().mockResolvedValue({ email: 'test@example.com' }) },
    entities: { Specimen: { list: vi.fn().mockResolvedValue([]) }, MarketListing: { create: vi.fn() } },
  },
}));

import CreateListingSheet from './CreateListingSheet.jsx';

describe('CreateListingSheet Accessibility & Micro-UX', () => {
  const mockClose = vi.fn();

  it('renders nothing when open is false', () => {
    const element = CreateListingSheet({ open: false, onClose: mockClose });
    const html = renderToStaticMarkup(element);
    expect(html).toBe('');
  });

  it('renders accessible controls and label associations when open with a prefilled specimen', () => {
    const element = CreateListingSheet({
      open: true,
      onClose: mockClose,
      prefillSpecimen,
    });

    const html = renderToStaticMarkup(element);

    // Verify close button
    expect(html).toContain('aria-label="Close trade listing"');
    expect(html).toContain('focus-visible:ring-2');

    // Verify input IDs and label associations
    expect(html).toContain('for="listing-title-input"');
    expect(html).toContain('id="listing-title-input"');
    expect(html).toContain('for="listing-description-input"');
    expect(html).toContain('id="listing-description-input"');
    expect(html).toContain('for="listing-price-input"');
    expect(html).toContain('id="listing-price-input"');

    // Verify trade-only switch toggle
    expect(html).toContain('id="trade-only-toggle"');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('aria-labelledby="trade-only-label"');

    // Verify specimen button ARIA attributes
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Select specimen Fluorite"');
  });
});
