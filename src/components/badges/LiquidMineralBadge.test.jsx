import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock('framer-motion', () => ({
  useReducedMotion: () => motionPreference.reduced,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

import LiquidMineralBadge from './LiquidMineralBadge.jsx';

const BADGE = {
  title: 'Crystal Guardian',
  icon: 'Gem',
  colorScheme: 'amethyst',
  rarity: 'legendary',
  material: 'crystal_core',
};

describe('LiquidMineralBadge motion behavior', () => {
  it('retains the full animated particle treatment by default', () => {
    motionPreference.reduced = false;
    const markup = renderToStaticMarkup(<LiquidMineralBadge badge={BADGE} size={96} />);

    expect(markup).toContain('lmb-breathe');
    expect(markup).toContain('lmb-particle');
    expect(markup).toContain('lmb-spin-ring');
  });

  it('uses a static, particle-free rendering for reduced motion', () => {
    motionPreference.reduced = true;
    const markup = renderToStaticMarkup(<LiquidMineralBadge badge={BADGE} size={96} arGlow />);

    expect(markup).not.toContain('lmb-particle');
    expect(markup).not.toContain('lmb-spin-ring');
    expect(markup).not.toContain('animate-pulse');
    expect(markup).not.toContain('animate-bounce');
  });
});
