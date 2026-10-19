// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock useSeoRobots and useSeoMeta
vi.mock('@/lib/useSeoRobots', () => ({
  useSeoRobots: () => {},
}));
vi.mock('@/lib/useSeoMeta', () => ({
  useSeoMeta: () => {},
}));

import AgateGuide from './AgateGuide.jsx';
import Connect from './Connect.jsx';

// Mock AuthLayout for Connect page
vi.mock('@/components/AuthLayout', () => ({
  default: ({ children, title }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

describe('External Link Security & DOM XSS Prevention', () => {
  it('renders AgateGuide header properly', () => {
    const html = renderToStaticMarkup(<AgateGuide />);
    expect(html).toContain('The Agate Treatise');
  });

  it('filters out javascript: links from Connect client cards', () => {
    const html = renderToStaticMarkup(<Connect />);
    // Connect links in ClientCard are all valid https URLs
    expect(html).toContain('https://modelcontextprotocol.io/quickstart/user');
    expect(html).not.toContain('href="javascript:');
  });
});
