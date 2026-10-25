// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import HelpTip from './HelpTip.jsx';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, role, id, ...props }) => {
      const ariaProps = {};
      Object.keys(props).forEach(k => {
        if (k.startsWith('aria-')) ariaProps[k] = props[k];
      });
      return (
        <div id={id} className={className} style={style} role={role} {...ariaProps}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('HelpTip', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders closed state with accessible defaults without topic', () => {
    const { getByRole, queryByRole } = render(<HelpTip tip="Explains private features" />);

    const button = getByRole('button', { name: 'Help' });
    expect(button).toBeDefined();
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('title')).toBe('Show help tooltip');
    expect(queryByRole('tooltip')).toBeNull();
  });

  it('renders closed state with topic in aria-label and title', () => {
    const { getByRole } = render(<HelpTip tip="Explains private features" topic="Private Rock Log" />);

    const button = getByRole('button', { name: 'Help for Private Rock Log' });
    expect(button).toBeDefined();
    expect(button.getAttribute('title')).toBe('Show help for Private Rock Log');
  });

  it('toggles open state and updates aria attributes when clicked', () => {
    const { getByRole, getByText } = render(<HelpTip tip="Explains private features" topic="Private Rock Log" />);

    const button = getByRole('button', { name: 'Help for Private Rock Log' });
    fireEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Close help for Private Rock Log');
    expect(button.getAttribute('title')).toBe('Close help for Private Rock Log');

    const tooltip = getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.getAttribute('aria-live')).toBe('polite');
    expect(getByText('Explains private features')).toBeDefined();
  });

  it('closes tooltip when Escape key is pressed', () => {
    const { getByRole, queryByRole } = render(<HelpTip tip="Explains private features" />);

    const button = getByRole('button', { name: 'Help' });
    fireEvent.click(button);

    expect(getByRole('tooltip')).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(queryByRole('tooltip')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Help');
  });
});
