// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StreakAtRiskCard from './StreakAtRiskCard.jsx';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, role, 'aria-label': ariaLabel, className, style }) => (
      <div role={role} aria-label={ariaLabel} className={className} style={style}>
        {children}
      </div>
    ),
  },
}));

describe('StreakAtRiskCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders null when companion is missing, streak is low, or already checked in', () => {
    const today = new Date().toISOString().slice(0, 10);

    const { container: c1 } = render(<MemoryRouter><StreakAtRiskCard companion={null} /></MemoryRouter>);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<MemoryRouter><StreakAtRiskCard companion={{ streak_days: 1, last_check_in_date: '2020-01-01' }} /></MemoryRouter>);
    expect(c2.firstChild).toBeNull();

    const { container: c3 } = render(<MemoryRouter><StreakAtRiskCard companion={{ streak_days: 5, last_check_in_date: today }} /></MemoryRouter>);
    expect(c3.firstChild).toBeNull();
  });

  it('renders card region and accessible CTA link when streak is at risk', () => {
    render(
      <MemoryRouter>
        <StreakAtRiskCard companion={{ streak_days: 5, last_check_in_date: '2020-01-01' }} />
      </MemoryRouter>
    );

    const region = screen.getByRole('region', { name: 'Streak warning' });
    expect(region).toBeDefined();

    expect(screen.getByText('5-day streak at risk')).toBeDefined();

    const link = screen.getByRole('link', { name: 'Check in to save your 5-day streak' });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/companion');
    expect(link.className).toContain('focus-visible:ring-2');
  });
});
