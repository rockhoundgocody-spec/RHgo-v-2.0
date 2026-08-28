import { vi, describe, it, expect } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, 'aria-label': ariaLabel, className, style, ...props }) => (
      <button onClick={onClick} aria-label={ariaLabel} className={className} style={style} {...props}>
        {children}
      </button>
    ),
    div: ({ children, onClick, className, style, ...props }) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, style, onClick }) => (
    <a href={to} className={className} style={style} onClick={onClick}>
      {children}
    </a>
  ),
}));

import GalleryGrid, { SpecimenGridTile, SpecimenLightboxModal } from './GalleryGrid.jsx';

describe('GalleryGrid', () => {
  const sampleSpecimens = [
    {
      id: '1',
      mineral_name: 'Quartz',
      rarity: 'common',
      image_url: 'http://example.com/quartz.jpg',
    },
    {
      id: '2',
      mineral_name: 'Amethyst',
      rarity: 'rare',
      found_at: 'Crystal Cave',
      found_date: '2025-05-10',
      ai_confidence: 0.95,
      notes: 'Beautiful purple specimen',
    }
  ];

  it('renders null when specimens is empty', () => {
    const result = GalleryGrid({ specimens: [] });
    expect(result).toBeNull();
  });

  it('renders grid with specimen tiles when specimens array is provided', () => {
    const element = GalleryGrid({ specimens: sampleSpecimens });
    expect(element).not.toBeNull();
  });

  it('renders SpecimenGridTile and SpecimenLightboxModal correctly', () => {
    const onSelect = vi.fn();
    const tile = SpecimenGridTile({ specimen: sampleSpecimens[0], index: 0, onSelect });
    expect(tile).not.toBeNull();

    const onClose = vi.fn();
    const modal = SpecimenLightboxModal({ specimen: sampleSpecimens[1], onClose });
    expect(modal).not.toBeNull();

    const emptyModal = SpecimenLightboxModal({ specimen: null, onClose });
    expect(emptyModal).toBeNull();
  });
});
