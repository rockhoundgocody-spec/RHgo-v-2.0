// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import BadgeUnlockAnimation from './BadgeUnlockAnimation.jsx';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, role, ...props }) => {
      const filteredProps = {};
      Object.keys(props).forEach(k => {
        if (k.startsWith('aria-') || k === 'id' || k === 'tabIndex') filteredProps[k] = props[k];
      });
      return <div className={className} style={style} role={role} {...filteredProps}>{children}</div>;
    },
    button: ({ children, className, onClick, type = 'button', style, ...props }) => {
      const filteredProps = {};
      Object.keys(props).forEach(k => {
        if (k.startsWith('aria-') || k === 'id' || k === 'tabIndex') filteredProps[k] = props[k];
      });
      return <button type={type} className={className} onClick={onClick} style={style} {...filteredProps}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => true, // default to true to skip phase timers in static tests
}));

describe('BadgeUnlockAnimation', () => {
  const mockBadge = {
    title: 'Crystal Chaser',
    description: 'Found 5 crystals in field mode',
    colorScheme: 'amethyst',
    rarity: 'rare',
    code: 'crystal_1',
  };

  it('renders modal dialog with accessible ARIA attributes and focus styles', () => {
    render(<BadgeUnlockAnimation badge={mockBadge} onClose={vi.fn()} />);

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('badge-unlock-title');

    const closeBtn = document.body.querySelector('[aria-label="Close unlock animation"]');
    expect(closeBtn).not.toBeNull();
    expect(closeBtn.getAttribute('type')).toBe('button');

    const phaseRegion = document.body.querySelector('[aria-label="Animation phase controls"]');
    expect(phaseRegion).not.toBeNull();

    const currentStepBtn = document.body.querySelector('[aria-current="step"]');
    expect(currentStepBtn).not.toBeNull();

    const matToggle = document.body.querySelector('[aria-controls="badge-material-panel"]');
    expect(matToggle).not.toBeNull();
    expect(matToggle.getAttribute('aria-expanded')).toBe('false');

    const continueBtn = document.body.querySelector('[aria-label="Continue and close badge unlock modal"]');
    expect(continueBtn).not.toBeNull();
    expect(continueBtn.classList.contains('focus-visible:ring-purple-300')).toBe(true);
  });
});
