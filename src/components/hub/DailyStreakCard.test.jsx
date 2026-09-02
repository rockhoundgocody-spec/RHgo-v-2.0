import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useId: () => 'test-streak-card-id',
  };
});

let DailyStreakCard;

describe('DailyStreakCard Accessibility', () => {
  beforeAll(async () => {
    DailyStreakCard = (await import('./DailyStreakCard.jsx')).default;
  });

  it('renders unrevealed button with proper accessibility attributes', () => {
    const markup = renderToStaticMarkup(<DailyStreakCard companion={{ streak_days: 5 }} />);

    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls="test-streak-card-id"');
    expect(markup).toContain('aria-label="Reveal today&#x27;s daily mystery mineral"');
    expect(markup).toContain('<span aria-hidden="true">❓</span>');
    expect(markup).toContain('5 day streak!');
  });
});
