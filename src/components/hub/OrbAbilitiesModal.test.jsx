// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import OrbAbilitiesModal from './OrbAbilitiesModal.jsx';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, style, role, onClick, ...props }, ref) => {
      const filteredProps = {};
      Object.keys(props).forEach((k) => {
        if (k.startsWith('aria-') || k === 'id' || k === 'tabIndex') {
          filteredProps[k] = props[k];
        }
      });
      return (
        <div ref={ref} className={className} style={style} role={role} onClick={onClick} {...filteredProps}>
          {children}
        </div>
      );
    }),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn().mockResolvedValue(null) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: {} }) },
    entities: { PlayerProfile: { filter: vi.fn().mockResolvedValue([]), update: vi.fn() } },
  },
}));

vi.mock('@/lib/orbAudio', () => ({
  getLuckyMineralOfTheDay: () => ({
    name: 'Lake Superior Agate',
    rarity: 'rare',
    color: '#fb923c',
    buff: '+20% Agate Spotting',
    tip: 'Search gravel bars after heavy rain',
    dateKey: '2025-01-01',
  }),
  playOrbChime: vi.fn(),
  triggerOrbHaptic: vi.fn(),
}));

vi.mock('@/lib/macrostrat', () => ({
  fetchGeologyAt: vi.fn().mockResolvedValue([]),
}));

describe('OrbAbilitiesModal', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<OrbAbilitiesModal open={false} mode="resonance" onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with accessible attributes in resonance mode', () => {
    render(<OrbAbilitiesModal open={true} mode="resonance" onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();

    const title = document.getElementById(titleId);
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Daily Geode Resonance');

    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    expect(closeBtn).not.toBeNull();
    expect(closeBtn.getAttribute('type')).toBe('button');
    expect(closeBtn.className).toContain('focus-visible:ring-2');

    const actionBtn = screen.getByRole('button', { name: /harmonize & claim/i });
    expect(actionBtn).not.toBeNull();
    expect(actionBtn.getAttribute('type')).toBe('button');
    expect(actionBtn.className).toContain('focus-visible:ring-2');
  });

  it('renders dialog with accessible attributes in radar mode', () => {
    render(<OrbAbilitiesModal open={true} mode="radar" onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();

    const title = document.getElementById(titleId);
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Lithosphere Strata Radar');

    const refreshBtn = screen.getByRole('button', { name: /refresh coordinates/i });
    expect(refreshBtn).not.toBeNull();
    expect(refreshBtn.getAttribute('type')).toBe('button');
    expect(refreshBtn.className).toContain('focus-visible:ring-2');
  });

  it('handles Escape key to close the modal via useFocusTrap', () => {
    const handleClose = vi.fn();
    render(<OrbAbilitiesModal open={true} mode="resonance" onClose={handleClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
