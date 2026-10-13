// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, initial, animate, exit, transition, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => true, // default to reduced motion so it renders in complete phase immediately
}));

vi.mock('./LiquidMineralBadge.jsx', () => ({
  default: () => <div data-testid="liquid-mineral-badge" />,
  COLOR_SCHEMES: {
    amethyst: {
      primary: 'hsl(270,70%,45%)',
      secondary: 'hsl(270,80%,75%)',
      crystal: 'hsl(270,90%,85%)',
      glow: 'hsla(270,90%,60%,0.9)',
      rim: 'hsl(270,80%,65%)',
    },
  },
}));

vi.mock('./BadgeMaterialPanel.jsx', () => ({
  default: () => <div data-testid="badge-material-panel" />,
}));

vi.mock('./AmethystParticleField.jsx', () => ({
  default: () => <div data-testid="amethyst-particle-field" />,
}));

vi.mock('./StarField.jsx', () => ({
  default: () => <div data-testid="star-field" />,
}));

vi.mock('./LiquidOrbGlow.jsx', () => ({
  default: () => <div data-testid="liquid-orb-glow" />,
}));

import BadgeUnlockAnimation from './BadgeUnlockAnimation.jsx';

const SAMPLE_BADGE = {
  code: 'badge_1',
  title: 'Crystal Master',
  description: 'Discovered 10 rare crystals',
  colorScheme: 'amethyst',
  rarity: 'epic',
};

describe('BadgeUnlockAnimation accessibility & keyboard interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal dialog with accessibility attributes and interactive control properties', () => {
    render(<BadgeUnlockAnimation badge={SAMPLE_BADGE} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('badge-unlock-title');

    // Close button
    const closeBtn = screen.getByRole('button', { name: 'Close unlock animation' });
    expect(closeBtn.getAttribute('type')).toBe('button');
    expect(closeBtn.className).toContain('focus-visible:ring-purple-300');

    // Share & Copy buttons
    const shareBtn = screen.getByRole('button', { name: 'Share achievement' });
    expect(shareBtn.getAttribute('type')).toBe('button');
    expect(shareBtn.className).toContain('focus-visible:ring-purple-300');

    const copyBtn = screen.getByRole('button', { name: 'Copy achievement link' });
    expect(copyBtn.getAttribute('type')).toBe('button');
    expect(copyBtn.className).toContain('focus-visible:ring-purple-300');

    // Material breakdown toggle button
    const materialBtn = screen.getByRole('button', { name: 'View material breakdown' });
    expect(materialBtn.getAttribute('type')).toBe('button');
    expect(materialBtn.getAttribute('aria-expanded')).toBe('false');
    expect(materialBtn.getAttribute('aria-controls')).toBe('badge-material-panel');
    expect(materialBtn.className).toContain('focus-visible:ring-purple-300');

    // Continue button
    const continueBtn = screen.getByRole('button', { name: 'Continue after unlocking badge' });
    expect(continueBtn.getAttribute('type')).toBe('button');
    expect(continueBtn.className).toContain('focus-visible:ring-purple-300');
  });

  it('invokes onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<BadgeUnlockAnimation badge={SAMPLE_BADGE} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('updates aria-expanded when material breakdown button is toggled', () => {
    render(<BadgeUnlockAnimation badge={SAMPLE_BADGE} onClose={vi.fn()} />);

    const materialBtn = screen.getByRole('button', { name: 'View material breakdown' });
    expect(materialBtn.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(materialBtn);

    const updatedMaterialBtn = screen.getByRole('button', { name: 'Hide material breakdown' });
    expect(updatedMaterialBtn.getAttribute('aria-expanded')).toBe('true');
  });
});
