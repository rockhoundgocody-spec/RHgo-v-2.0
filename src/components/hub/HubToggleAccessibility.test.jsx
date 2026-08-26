import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

let ChaosModeToggle;
let DailyStreakCard;

describe('hub toggle accessibility', () => {
  beforeAll(async () => {
    ChaosModeToggle = (await import('./ChaosModeToggle')).default;
    DailyStreakCard = (await import('./DailyStreakCard')).default;
  });

  it('exposes chaos mode state and focus styling', () => {
    const markup = renderToStaticMarkup(
      <ChaosModeToggle chaos onToggle={vi.fn()} locked={false} />
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('focus-visible:ring-hud-cyan/70');
    expect(markup).toContain('motion-reduce:active:scale-100');
  });

  it('gives the mystery reveal a visible focus state and reduced-motion styles', () => {
    const markup = renderToStaticMarkup(<DailyStreakCard companion={{ streak_days: 2 }} />);

    expect(markup).toContain('type="button"');
    expect(markup).toContain('focus-visible:ring-orange-400/70');
    expect(markup).toContain('motion-reduce:transition-none');
  });
});
