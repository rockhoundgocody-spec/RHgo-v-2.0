// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LandAccessPanel from './LandAccessPanel.jsx';

describe('LandAccessPanel', () => {
  it('returns null when hotspot is not provided', () => {
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={null} />);
    expect(html).toBe('');
  });

  it('renders open access status correctly without permit requirement', () => {
    const hotspot = {
      name: 'Emerald Ridge',
      access_status: 'open',
      claim_type: 'none',
      access_notes: 'Free public access along the creek bank.',
    };
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={hotspot} />);
    expect(html).toContain('Open Access');
    expect(html).toContain('Free public access along the creek bank.');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders permit link with accessible aria-label and focus-visible styling when permit is required', () => {
    const hotspot = {
      name: 'Crystal Peak Mine',
      access_status: 'restricted',
      permit_required: true,
      permit_cost: '$10/day',
      permit_url: 'https://example.com/permits/crystal-peak',
      claim_type: 'unpatented',
    };
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={hotspot} />);
    expect(html).toContain('Permit Required');
    expect(html).toContain('$10/day');
    expect(html).toContain('href="https://example.com/permits/crystal-peak"');
    expect(html).toContain('aria-label="Get permit for Crystal Peak Mine (opens in new tab)"');
    expect(html).toContain('focus-visible:ring-hud-cyan/80');
    expect(html).toContain('focus-visible:outline-none');
  });

  it('renders closed warning and hidden decorative icons for closed sites', () => {
    const hotspot = {
      name: 'Quartz Quarry',
      access_status: 'closed',
      claim_type: 'patented',
    };
    const html = renderToStaticMarkup(<LandAccessPanel hotspot={hotspot} />);
    expect(html).toContain('Closed');
    expect(html).toContain('This site is currently closed to collecting. Do not enter.');
    expect(html).toContain('aria-hidden="true"');
  });
});
