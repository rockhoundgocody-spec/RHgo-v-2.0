// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock BadgeAwarderContext
vi.mock('@/lib/BadgeAwarderContext', () => ({
  useBadgeAwarderContext: () => ({
    earnedCodes: new Set(['quartz_pioneer']),
    allBadges: [
      {
        code: 'quartz_pioneer',
        title: 'Quartz Pioneer',
        rarity: 'common',
        description: 'Find first quartz specimen',
        colorScheme: 'amethyst',
        progress: () => ({ current: 1, target: 1 }),
      },
      {
        code: 'ruby_master',
        title: 'Ruby Master',
        rarity: 'rare',
        description: 'Find ruby specimen',
        colorScheme: 'amethyst',
        progress: () => ({ current: 0, target: 5 }),
      },
    ],
    badgeMetrics: {},
    earnedRecords: {
      quartz_pioneer: { earned_at: '2025-01-01T00:00:00Z' },
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

import Badges from './Badges.jsx';

describe('Badges Page Accessibility & Micro-UX', () => {
  it('renders progress bar elements with role="progressbar" and valid aria attributes', () => {
    const html = renderToStaticMarkup(<Badges />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Collection Progress: 1 of 2 earned"');
  });

  it('provides aria-pressed and focus-visible attributes for mode selector, filters, and sort controls', () => {
    const html = renderToStaticMarkup(<Badges />);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('focus-visible:ring-2');
  });
});
