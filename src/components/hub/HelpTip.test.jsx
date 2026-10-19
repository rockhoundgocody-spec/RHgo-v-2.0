// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import HelpTip from './HelpTip.jsx';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, id, role, 'aria-live': ariaLive, className, style }) => (
      <div id={id} role={role} aria-live={ariaLive} className={className} style={style}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('HelpTip accessibility and interactions', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders closed state with topic-aware aria-label and title', () => {
    render(<HelpTip topic="Private photo storage" tip="Photos are kept private." />);
    const button = screen.getByRole('button', { name: 'Help for Private photo storage' });
    expect(button).toBeDefined();
    expect(button.getAttribute('title')).toBe('Help for Private photo storage');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders closed state fallback when topic is omitted', () => {
    render(<HelpTip tip="General help tip." />);
    const button = screen.getByRole('button', { name: 'Help' });
    expect(button).toBeDefined();
    expect(button.getAttribute('title')).toBe('Help');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles open state and displays tooltip with role="tooltip" and aria-live="polite"', () => {
    render(<HelpTip topic="Private photo storage" tip="Photos are kept private." />);
    const button = screen.getByRole('button', { name: 'Help for Private photo storage' });

    fireEvent.click(button);

    const openButton = screen.getByRole('button', { name: 'Close help for Private photo storage' });
    expect(openButton.getAttribute('aria-expanded')).toBe('true');

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('Photos are kept private.')).toBeDefined();
  });
});
