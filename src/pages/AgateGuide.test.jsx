import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import AgateGuide from './AgateGuide';

vi.mock('@/lib/useSeoRobots', () => ({
  useSeoRobots: vi.fn(),
}));
vi.mock('@/lib/useSeoMeta', () => ({
  useSeoMeta: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

vi.mock('@/lib/agateData', () => ({
  AGATE_GENESIS: 'Genesis text',
  AGATE_TRACE_COLORS: [],
  AGATE_OPTICAL: [],
  AGATE_STRUCTURAL: [],
  AGATE_VARIETIES: [
    {
      name: 'Safe Agate',
      rarity: 'common',
      region: 'Region A',
      setting: 'Setting A',
      characteristics: 'Char A',
      age: 'Age A',
      image_url: 'safe-test',
    },
    {
      name: 'Unsafe Agate',
      rarity: 'rare',
      region: 'Region B',
      setting: 'Setting B',
      characteristics: 'Char B',
      age: 'Age B',
      image_url: 'unsafe-test',
    },
  ],
}));

vi.mock('@/lib/agateImages', () => ({
  agateImage: (url) => {
    if (url === 'unsafe-test') {
      return {
        artist: 'Attacker',
        license: 'CC-BY',
        licenseUrl: 'javascript:alert(1)',
        page: 'javascript:alert(2)',
      };
    }
    if (url === 'safe-test') {
      return {
        artist: 'Photographer',
        license: 'CC-BY-SA',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        page: 'https://commons.wikimedia.org/wiki/File:Agate.jpg',
      };
    }
    return null;
  },
}));

describe('AgateGuide URL Sanitization', () => {
  it('renders AgateGuide without crashing', () => {
    const html = renderToStaticMarkup(<AgateGuide />);
    expect(html).toContain('The Agate Treatise');
  });

  it('rejects unsafe javascript: URLs in PhotoCredit rendering', () => {
    // Render AgateGuide with state preset or test PhotoCredit via rendered output
    const html = renderToStaticMarkup(<AgateGuide />);
    expect(html).not.toContain('href="javascript:alert(1)"');
    expect(html).not.toContain('href="javascript:alert(2)"');
  });
});
