// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('@/lib/orbAudio', () => ({
  getLuckyMineralOfTheDay: () => ({
    name: 'Petoskey Stone',
    rarity: 'rare',
    color: '#38bdf8',
    buff: '+20% Fossil Discovery',
    tip: 'Look near fresh wave action.',
    dateKey: '2025-01-01',
  }),
  playOrbChime: vi.fn(),
  triggerOrbHaptic: vi.fn(),
}));

vi.mock('@/lib/macrostrat', () => ({
  fetchGeologyAt: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn().mockRejectedValue(new Error('no auth')) },
    functions: { invoke: vi.fn().mockResolvedValue({}) },
    entities: { PlayerProfile: { filter: vi.fn().mockResolvedValue([]), update: vi.fn() } },
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, onClick, ...props }, ref) => (
      <div ref={ref} className={className} onClick={onClick} {...props}>
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import OrbAbilitiesModal from './OrbAbilitiesModal';

describe('OrbAbilitiesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render when open is false', () => {
    render(<OrbAbilitiesModal open={false} mode="resonance" onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders modal dialog with accessible ARIA attributes and focus styles', () => {
    render(<OrbAbilitiesModal open={true} mode="resonance" onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('orb-abilities-title');

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.id).toBe('orb-abilities-title');
    expect(heading.textContent).toContain('Daily Geode Resonance');

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn.getAttribute('type')).toBe('button');
    expect(closeBtn.getAttribute('title')).toBe('Close');
    expect(closeBtn.className).toContain('focus-visible:ring-2');
  });

  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<OrbAbilitiesModal open={true} mode="resonance" onClose={handleClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<OrbAbilitiesModal open={true} mode="resonance" onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders correctly in radar mode with proper title association', () => {
    render(<OrbAbilitiesModal open={true} mode="radar" onClose={vi.fn()} />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.id).toBe('orb-abilities-title');
    expect(heading.textContent).toContain('Lithosphere Strata Radar');

    const refreshBtn = screen.getByRole('button', { name: /refresh coordinates/i });
    expect(refreshBtn.getAttribute('type')).toBe('button');
    expect(refreshBtn.className).toContain('focus-visible:ring-2');
  });
});
