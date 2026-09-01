import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, role, className, style, ...props }) => {
      const filteredProps = {};
      Object.keys(props).forEach((key) => {
        if (
          key.startsWith('aria-') ||
          key.startsWith('data-') ||
          key === 'id' ||
          key === 'onClick'
        ) {
          filteredProps[key] = props[key];
        }
      });
      return (
        <div role={role} className={className} style={style} {...filteredProps}>
          {children}
        </div>
      );
    },
  },
}));

vi.mock('@/components/badges/LiquidMineralBadge.jsx', () => ({
  default: () => <div data-testid="liquid-badge" />,
}));

import RareMineralPopup from './RareMineralPopup';

describe('RareMineralPopup', () => {
  it('renders accessibility attributes and dialog structure correctly', () => {
    const handleClose = vi.fn();
    const html = renderToStaticMarkup(
      <RareMineralPopup
        rarity="rare"
        mineralName="Amethyst Cluster"
        onClose={handleClose}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('Amethyst Cluster');
    expect(html).toContain('Rare Find!');
    expect(html).toContain('aria-label="Dismiss rare mineral popup"');
    expect(html).toContain('focus-visible:ring-cyan-400/70');
  });

  it('renders legendary rarity configuration correctly', () => {
    const handleClose = vi.fn();
    const html = renderToStaticMarkup(
      <RareMineralPopup
        rarity="legendary"
        mineralName="Painite Crystal"
        onClose={handleClose}
      />
    );

    expect(html).toContain('Legendary Find!!');
    expect(html).toContain('Painite Crystal');
  });
});
