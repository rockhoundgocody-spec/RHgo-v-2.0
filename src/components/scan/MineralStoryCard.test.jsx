import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }) => {
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
        <div className={className} style={style} {...filteredProps}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import MineralStoryCard from './MineralStoryCard.jsx';

describe('MineralStoryCard', () => {
  it('renders null when mineralName is missing or unrecognized', () => {
    const htmlNull = renderToStaticMarkup(<MineralStoryCard mineralName={null} />);
    expect(htmlNull).toBe('');

    const htmlUnknown = renderToStaticMarkup(<MineralStoryCard mineralName="Unknown Mineral" />);
    expect(htmlUnknown).toBe('');
  });

  it('renders story card with correct accessibility attributes for recognized mineral', () => {
    const html = renderToStaticMarkup(<MineralStoryCard mineralName="Petoskey Stone" />);

    expect(html).toContain('Petoskey Stone — Origin Story');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-controls=');
    expect(html).toContain('aria-label="Collapse Petoskey Stone — Origin Story"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focus-visible:ring-2');
    expect(html).toContain('focus-visible:ring-amethyst-glow/50');
  });
});
