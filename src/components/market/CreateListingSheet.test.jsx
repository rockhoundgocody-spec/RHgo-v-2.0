// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
    button: React.forwardRef(({ children, ...props }, ref) => <button ref={ref} {...props}>{children}</button>),
  },
  AnimatePresence: ({ children }) => children,
}));

const mockSpecimens = [
  { id: 'spec-1', mineral_name: 'Quartz', rarity: 'common' },
  { id: 'spec-2', mineral_name: 'Amethyst', rarity: 'rare' },
];

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        list: vi.fn(() => Promise.resolve(mockSpecimens)),
      },
      MarketListing: {
        create: vi.fn(() => Promise.resolve({ id: 'list-1' })),
      },
    },
    auth: {
      me: vi.fn(() => Promise.resolve({ email: 'geologist@example.com', full_name: 'Jane Doe' })),
    },
  },
}));

import CreateListingSheet from './CreateListingSheet.jsx';

describe('CreateListingSheet', () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal dialog with accessible ARIA attributes', async () => {
    await act(async () => {
      render(<CreateListingSheet open={true} onClose={onClose} onCreated={onCreated} />);
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('create-listing-title');

    expect(screen.getByRole('heading', { name: /List for Trade/i })).not.toBeNull();

    expect(screen.getByText('Quartz')).not.toBeNull();
    const quartzBtn = screen.getByText('Quartz').closest('button');
    expect(quartzBtn.getAttribute('aria-label')).toBe('Select specimen Quartz');
    expect(quartzBtn.getAttribute('type')).toBe('button');
  });

  it('supports keyboard dismissal via Escape key', () => {
    render(<CreateListingSheet open={true} onClose={onClose} onCreated={onCreated} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting a specimen and toggling trade-only switch', async () => {
    await act(async () => {
      render(
        <CreateListingSheet
          open={true}
          onClose={onClose}
          onCreated={onCreated}
          prefillSpecimen={mockSpecimens[0]}
        />
      );
    });

    const quartzBtn = screen.getByText('Quartz').closest('button');
    expect(quartzBtn.getAttribute('aria-pressed')).toBe('true');

    const tradeSwitch = screen.getByRole('switch', { name: /Trade only toggle/i });
    expect(tradeSwitch.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(tradeSwitch);
    expect(tradeSwitch.getAttribute('aria-checked')).toBe('true');
  });
});
