import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LandAccessPanel from './LandAccessPanel.jsx';

describe('LandAccessPanel', () => {
  it('returns null when hotspot is missing', () => {
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={null} />);
    expect(html).toBe('');
  });

  it('renders open access status correctly', () => {
    const hotspot = {
      name: 'Crystal Ridge',
      access_status: 'open',
    };
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={hotspot} />);
    expect(html).toContain('Open Access');
    expect(html).toContain('Collecting allowed');
  });

  it('renders permit requirements with proper aria-label and focus-visible styling', () => {
    const hotspot = {
      name: 'Emerald Mine',
      access_status: 'restricted',
      permit_required: true,
      permit_cost: '$10',
      permit_url: 'https://example.com/permit',
    };
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={hotspot} />);
    expect(html).toContain('Permit Required');
    expect(html).toContain('$10');
    expect(html).toContain('href="https://example.com/permit"');
    expect(html).toContain('aria-label="Get permit for Emerald Mine (opens in new tab)"');
    expect(html).toContain('focus-visible:ring-hud-cyan/60');
  });

  it('renders claim info and closed warnings when site is closed', () => {
    const hotspot = {
      name: 'Forbidden Hollow',
      access_status: 'closed',
      claim_type: 'patented',
    };
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={hotspot} />);
    expect(html).toContain('Closed');
    expect(html).toContain('Patented Claim');
    expect(html).toContain('This site is currently closed to collecting. Do not enter.');
  });
});
