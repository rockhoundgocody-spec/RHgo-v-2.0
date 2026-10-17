// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

import HelpTip from './HelpTip.jsx';

describe('HelpTip', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders button with topic-aware aria-label and title when provided', () => {
    const { getByRole } = render(<HelpTip topic="Photo privacy" tip="New photos are stored privately" />);
    const button = getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Help for Photo privacy');
    expect(button.getAttribute('title')).toBe('Help: Photo privacy');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('falls back to default aria-label and title when topic is not provided', () => {
    const { getByRole } = render(<HelpTip tip="General help text" />);
    const button = getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Help information');
    expect(button.getAttribute('title')).toBe('Click for help info');
  });

  it('toggles aria-expanded, aria-label, and title on click and renders polite tooltip', () => {
    const { getByRole, getByText } = render(<HelpTip topic="Photo privacy" tip="New photos are stored privately" />);
    const button = getByRole('button');

    fireEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Close help for Photo privacy');
    expect(button.getAttribute('title')).toBe('Close tip');

    const tooltip = getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.getAttribute('aria-live')).toBe('polite');
    expect(getByText('New photos are stored privately')).toBeDefined();
  });
});
