// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/api/base44Client', () => ({
  base44: {
    analytics: { track: vi.fn() },
    entities: { Specimen: { list: vi.fn().mockResolvedValue([]) } },
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('@/components/badges/LiquidMineralBadge.jsx', () => ({
  default: () => <div data-testid="liquid-badge" />,
}));

vi.mock('@/components/explore/LandAccessPanel.jsx', () => ({
  default: () => <div data-testid="land-access-panel" />,
}));

import HotspotDetailSheet from './HotspotDetailSheet';

describe('HotspotDetailSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockHotspot = {
    id: 'spot-123',
    name: 'Emerald Ridge',
    land_type: 'public',
    state: 'NC',
    difficulty: 'moderate',
    trust_score: 0.95,
    minerals: ['emerald', 'quartz'],
    description: 'Scenic ridge known for quartz and beryl deposits.',
    rules: 'No heavy machinery.',
  };

  it('renders nothing when hotspot is null or undefined', () => {
    const { container } = render(
      <MemoryRouter>
        <HotspotDetailSheet hotspot={null} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with accessible attributes, linked title, and focus-visible close button', () => {
    render(
      <MemoryRouter>
        <HotspotDetailSheet
          hotspot={mockHotspot}
          specimens={[]}
          earnedCodes={new Set()}
          collectionGapMinerals={['emerald']}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    // Title linked via aria-labelledby
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    const titleHeading = screen.getByRole('heading', { level: 2 });
    expect(titleHeading.getAttribute('id')).toBe(titleId);
    expect(titleHeading.textContent).toBe('Emerald Ridge');

    // Close button
    const closeBtn = screen.getByRole('button', { name: 'Close hotspot details' });
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('type')).toBe('button');
    expect(closeBtn.getAttribute('title')).toBe('Close hotspot details');
    expect(closeBtn.className).toContain('focus-visible:ring-2');
  });

  it('triggers onClose when close button is clicked or Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <HotspotDetailSheet
          hotspot={mockHotspot}
          specimens={[]}
          earnedCodes={new Set()}
          collectionGapMinerals={[]}
          onClose={handleClose}
        />
      </MemoryRouter>
    );

    const closeBtn = screen.getByRole('button', { name: 'Close hotspot details' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key press triggers focus trap onClose
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
