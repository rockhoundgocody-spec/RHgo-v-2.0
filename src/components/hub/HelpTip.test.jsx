// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import HelpTip from './HelpTip';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('HelpTip', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders closed trigger button with default ARIA label and title', () => {
    render(<HelpTip tip="This is helpful information." />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Help');
    expect(button.getAttribute('title')).toBe('Help');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders topic-aware ARIA label and title when closed and open', () => {
    render(<HelpTip topic="Private Rock Log" tip="Your personal stash of rock finds." />);
    const button = screen.getByRole('button');

    // Closed state
    expect(button.getAttribute('aria-label')).toBe('Help for Private Rock Log');
    expect(button.getAttribute('title')).toBe('Help for Private Rock Log');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    // Click to open
    fireEvent.click(button);

    expect(button.getAttribute('aria-label')).toBe('Close help for Private Rock Log');
    expect(button.getAttribute('title')).toBe('Close help for Private Rock Log');
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // Check tooltip content & polite aria-live attribute
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.getAttribute('aria-live')).toBe('polite');
    expect(tooltip.textContent).toContain('Your personal stash of rock finds.');
  });

  it('closes on Escape key press', () => {
    render(<HelpTip topic="Test Feature" tip="Some tip" />);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
