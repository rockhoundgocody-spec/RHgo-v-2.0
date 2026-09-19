import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockSetCurrentIndex = vi.fn();
let mockCurrentIndex = 0;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      mockCurrentIndex = typeof initial === 'function' ? initial() : initial;
      return [mockCurrentIndex, mockSetCurrentIndex];
    },
  };
});

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, className, style, ...props }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, ...props }) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: ({ size, className }) => <svg data-testid="icon-chevron-left" width={size} className={className} />,
  ChevronRight: ({ size, className }) => <svg data-testid="icon-chevron-right" width={size} className={className} />,
  Gem: ({ size, className }) => <svg data-testid="icon-gem" width={size} className={className} />,
  ArrowRight: ({ size, className }) => <svg data-testid="icon-arrow-right" width={size} className={className} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/lib/orbAudio', () => ({
  triggerOrbHaptic: vi.fn(),
}));

import HolographicVaultView from './HolographicVaultView';
import { triggerOrbHaptic } from '@/lib/orbAudio';

describe('HolographicVaultView', () => {
  const mockSpecimens = [
    {
      id: 'specimen-1',
      name: 'Amethyst Crystal',
      scientific_name: 'SiO2 (Quartz)',
      image_url: 'https://example.com/amethyst.jpg',
      rarity: 'Rare',
      hardness_mohs: '7.0',
      crystal_system: 'Trigonal',
      value_estimate: '$45–$90',
    },
    {
      id: 'specimen-2',
      name: 'Pyrite Cube',
      scientific_name: 'FeS2',
      image_url: null,
      rarity: 'Uncommon',
      hardness_mohs: '6.5',
      crystal_system: 'Isometric',
      value_estimate: '$20–$40',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentIndex = 0;
  });

  it('returns null when specimens array is empty or not provided', () => {
    expect(HolographicVaultView({ specimens: [] })).toBeNull();
    expect(HolographicVaultView({})).toBeNull();
  });

  it('renders specimen card details and accessible controls correctly', () => {
    const tree = HolographicVaultView({ specimens: mockSpecimens });
    expect(tree).not.toBeNull();
    expect(tree.type).toBe('div');

    const [, navigator, pedestalCard] = tree.props.children;

    // Check Carousel Navigator
    const [prevBtn, counterSpan, nextBtn] = navigator.props.children;

    expect(prevBtn.props['aria-label']).toBe('Previous specimen');
    expect(prevBtn.props.className).toContain('focus-visible:ring-2');
    expect(prevBtn.props.className).toContain('focus-visible:ring-amethyst-glow');

    expect(counterSpan.props.children).toEqual(['Vault ', 1, ' of ', 2]);

    expect(nextBtn.props['aria-label']).toBe('Next specimen');
    expect(nextBtn.props.className).toContain('focus-visible:ring-2');

    // Check Pedestal Card Specimen Info
    const motionDiv = pedestalCard.props.children;
    const [imageContainer, , detailsContainer, metricsContainer, linkContainer] = motionDiv.props.children;

    // Image & Rarity
    const [imgElement, , rarityContainer] = imageContainer.props.children;
    expect(imgElement.type).toBe('img');
    expect(imgElement.props.src).toBe('https://example.com/amethyst.jpg');
    expect(imgElement.props.alt).toBe('Amethyst Crystal');

    const rarityBadge = rarityContainer.props.children;
    expect(rarityBadge.props.children).toBe('Rare');

    // Details
    const [titleHeading, subHeading] = detailsContainer.props.children;
    expect(titleHeading.props.children).toBe('Amethyst Crystal');
    expect(subHeading.props.children).toBe('SiO2 (Quartz)');

    // Metrics grid (Hardness, System, Appraisal)
    const [hardnessCol, systemCol, appraisalCol] = metricsContainer.props.children;
    expect(hardnessCol.props.children[1].props.children).toBe('7.0M');
    expect(systemCol.props.children[1].props.children).toBe('Trigonal');
    expect(appraisalCol.props.children[1].props.children).toBe('$45–$90');

    // Link Dossier Target
    const linkComponent = linkContainer.props.children;
    expect(linkComponent.props.to).toBe('/specimen/specimen-1');
  });

  it('renders fallback icon and fallback specimen values when fields are missing', () => {
    const sparseSpecimens = [
      {
        id: 'specimen-sparse',
        // image_url, name, scientific_name, rarity, hardness_mohs, crystal_system, value_estimate missing
      },
    ];

    const tree = HolographicVaultView({ specimens: sparseSpecimens });
    const [, , pedestalCard] = tree.props.children;
    const motionDiv = pedestalCard.props.children;

    const [imageContainer, , detailsContainer, metricsContainer, linkContainer] = motionDiv.props.children;

    // Fallback Icon Container when no image_url
    const [fallbackIconWrapper, , rarityContainer] = imageContainer.props.children;
    const gemIcon = fallbackIconWrapper.props.children;
    expect(gemIcon.props.size).toBe(48);

    const rarityBadge = rarityContainer.props.children;
    expect(rarityBadge.props.children).toBe('Common');

    // Fallback details
    const [titleHeading, subHeading] = detailsContainer.props.children;
    expect(titleHeading.props.children).toBe('Unknown Mineral');
    expect(subHeading).toBeFalsy();

    // Fallback metrics
    const [hardnessCol, systemCol, appraisalCol] = metricsContainer.props.children;
    expect(hardnessCol.props.children[1].props.children).toBe('7.0M');
    expect(systemCol.props.children[1].props.children).toBe('Trigonal');
    expect(appraisalCol.props.children[1].props.children).toBe('$15–$35');

    // Dossier link
    expect(linkContainer.props.children.props.to).toBe('/specimen/specimen-sparse');
  });

  it('handles prev and next navigation clicks and triggers haptics', () => {
    const tree = HolographicVaultView({ specimens: mockSpecimens });
    const [, navigator] = tree.props.children;
    const [prevBtn, , nextBtn] = navigator.props.children;

    // Click Next
    nextBtn.props.onClick();
    expect(triggerOrbHaptic).toHaveBeenLastCalledWith('tap');
    expect(mockSetCurrentIndex).toHaveBeenCalledTimes(1);

    // Call the state updater passed to mockSetCurrentIndex
    const nextUpdater = mockSetCurrentIndex.mock.calls[0][0];
    expect(nextUpdater(0)).toBe(1); // (0 + 1) % 2 = 1

    // Click Prev
    prevBtn.props.onClick();
    expect(triggerOrbHaptic).toHaveBeenLastCalledWith('tap');
    expect(mockSetCurrentIndex).toHaveBeenCalledTimes(2);

    const prevUpdater = mockSetCurrentIndex.mock.calls[1][0];
    expect(prevUpdater(0)).toBe(1); // (0 - 1 + 2) % 2 = 1
  });
});
