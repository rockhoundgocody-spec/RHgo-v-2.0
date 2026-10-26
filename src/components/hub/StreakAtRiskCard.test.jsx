// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StreakAtRiskCard from './StreakAtRiskCard.jsx';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, role, ...props }) => {
      const filteredProps = {};
      Object.keys(props).forEach(k => {
        if (k.startsWith('aria-') || k === 'id' || k === 'tabIndex') filteredProps[k] = props[k];
      });
      return <div className={className} style={style} role={role} {...filteredProps}>{children}</div>;
    },
  },
}));

describe('StreakAtRiskCard', () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  it('renders card with region role, aria-label, and focus-visible ring on CTA when streak is at risk', () => {
    const companion = {
      streak_days: 5,
      last_check_in_date: yesterdayStr,
    };

    render(
      <MemoryRouter>
        <StreakAtRiskCard companion={companion} />
      </MemoryRouter>
    );

    const region = screen.getByRole('region', { name: 'Streak warning' });
    expect(region).not.toBeNull();

    const link = screen.getByRole('link', { name: 'Save your 5-day streak by checking in with Clover' });
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/companion');
    expect(link.className).toContain('focus-visible:ring-orange-400');
    expect(link.className).toContain('active:scale-95');
  });

  it('returns null when user already checked in today', () => {
    const companion = {
      streak_days: 5,
      last_check_in_date: todayStr,
    };

    const { container } = render(
      <MemoryRouter>
        <StreakAtRiskCard companion={companion} />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when streak is less than 2 days', () => {
    const companion = {
      streak_days: 1,
      last_check_in_date: yesterdayStr,
    };

    const { container } = render(
      <MemoryRouter>
        <StreakAtRiskCard companion={companion} />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
