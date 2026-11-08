import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn().mockResolvedValue(null) },
    entities: {
      ClubChapter: { list: vi.fn().mockResolvedValue([]) },
      ClubEvent: { list: vi.fn().mockResolvedValue([]) },
    },
  },
}));

vi.mock('@/lib/useSeoRobots', () => ({
  useSeoRobots: vi.fn(),
}));

vi.mock('@/lib/useSeoMeta', () => ({
  useSeoMeta: vi.fn(),
}));

import Clubs, { ChapterCard } from './Clubs.jsx';

describe('Clubs component and ChapterCard website validation', () => {
  it('renders Clubs empty state properly', () => {
    const html = renderToStaticMarkup(<Clubs />);
    expect(html).toContain('Club Chapters');
  });

  it('renders valid HTTPS website link in ChapterCard with target="_blank" and rel="noopener noreferrer"', () => {
    const chapter = {
      id: 'chap-1',
      name: 'Cascadia Mineral Society',
      website_url: 'https://example.com/cascadia',
      contact_email: 'info@cascadia.org',
    };
    const html = renderToStaticMarkup(<ChapterCard chapter={chapter} events={[]} />);
    expect(html).toContain('href="https://example.com/cascadia"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="Visit Cascadia Mineral Society website (opens in new tab)"');
  });

  it('suppresses malicious URL schemes (javascript:, data:) from ChapterCard website links', () => {
    const xssChapter = {
      id: 'chap-2',
      name: 'Malicious Mineral Club',
      website_url: 'javascript:alert(document.cookie)',
      contact_email: 'xss@malicious.com',
    };
    const html = renderToStaticMarkup(<ChapterCard chapter={xssChapter} events={[]} />);
    expect(html).not.toContain('href="javascript:alert(document.cookie)"');
    expect(html).not.toContain('Visit Malicious Mineral Club website');

    const dataChapter = {
      id: 'chap-3',
      name: 'Data URI Club',
      website_url: 'data:text/html,<script>alert(1)</script>',
    };
    const htmlData = renderToStaticMarkup(<ChapterCard chapter={dataChapter} events={[]} />);
    expect(htmlData).not.toContain('data:text/html');
  });
});
