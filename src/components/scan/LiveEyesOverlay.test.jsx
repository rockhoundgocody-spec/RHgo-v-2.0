import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import LiveEyesOverlay from './LiveEyesOverlay.jsx';

const render = (eyes, props = {}) =>
  renderToStaticMarkup(<LiveEyesOverlay eyes={eyes} onLock={() => {}} onUpgrade={() => {}} {...props} />);

const base = { status: 'watching', candidates: [], quality: null, reason: null, meter: null, stale: false };

describe('LiveEyesOverlay', () => {
  it('shows the best guess, alternates and a spoken summary', () => {
    const html = render({
      ...base,
      candidates: [
        { name: 'Lake Superior agate', confidence: 0.82, rarity: 'uncommon' },
        { name: 'Carnelian', confidence: 0.4, rarity: 'common' },
        { name: 'Banded jasper', confidence: 0.35, rarity: 'common' },
      ],
    });
    expect(html).toContain('Lake Superior agate');
    expect(html).toContain('uncommon');
    expect(html).toContain('82% sure');
    expect(html).toContain('or Carnelian · Banded jasper');
    expect(html).toContain('Looks like Lake Superior agate, 80 percent sure, uncommon.');
    expect(html).toContain('Lock ID');
  });

  it('coaches when nothing is identified yet', () => {
    const html = render({ ...base, reason: 'moving' });
    expect(html).toContain('Aim at a specimen and hold steady.');
    expect(html).toContain('Hold steady on a specimen');
    expect(html).not.toContain('More live labels');
  });

  it('shows the daily allowance for free members and offers more when it runs out', () => {
    const counting = render({ ...base, meter: { paid: false, used: 3, limit: 15 } });
    expect(counting).toContain('12 live labels left today');

    const spent = render({ ...base, status: 'paused', reason: 'daily', meter: { paid: false, used: 15, limit: 15 } });
    expect(spent).toContain('Live paused');
    expect(spent).toContain('used up');
    expect(spent).toContain('More live labels');
    expect(spent).toContain('0 live labels left today');
  });

  it('hides the counter and upgrade for paid members', () => {
    const html = render({ ...base, status: 'paused', reason: 'daily', meter: { paid: true, used: 300, limit: 300 } });
    expect(html).not.toContain('left today');
    expect(html).not.toContain('More live labels');
  });

  it('disables Lock ID when the camera is not ready', () => {
    const html = render(base, { lockDisabled: true });
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Lock ID/);
  });
});
