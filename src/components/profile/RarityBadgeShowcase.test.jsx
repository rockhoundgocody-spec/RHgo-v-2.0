// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RarityBadgeShowcase from './RarityBadgeShowcase.jsx';

describe('RarityBadgeShowcase Accessibility', () => {
  it('renders progressbar roles with accurate ARIA properties for unlocked tiers', () => {
    const earnedCodes = new Set(['rarity_common', 'rarity_uncommon']);
    const rarityCounts = { common: 6, uncommon: 0, rare: 0, legendary: 0 };

    const html = renderToStaticMarkup(
      <RarityBadgeShowcase earnedCodes={earnedCodes} rarityCounts={rarityCounts} />
    );

    // Common has 6 finds -> hits milestones 1 and 5 -> 2/4 completed
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Common milestone progress"');
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="4"');
    expect(html).toContain('aria-valuetext="2 of 4 milestones reached"');
  });

  it('renders region roles with clear accessible labels for both unlocked and locked tiers', () => {
    const earnedCodes = new Set(['rarity_common']);
    const rarityCounts = { common: 26, uncommon: 0, rare: 0, legendary: 0 };

    const html = renderToStaticMarkup(
      <RarityBadgeShowcase earnedCodes={earnedCodes} rarityCounts={rarityCounts} />
    );

    // Unlocked common card region
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Common tier: 26 collected, Expert rank"');

    // Locked uncommon card region
    expect(html).toContain('aria-label="Uncommon tier: Locked"');
  });
});
