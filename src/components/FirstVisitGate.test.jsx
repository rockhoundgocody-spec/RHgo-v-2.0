// @vitest-environment jsdom
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FirstVisitGate from './FirstVisitGate';
import { HOME_FEATURES } from './HomeFeatures';
import { _resetPlayAppCache } from '@/lib/isNativeApp';

vi.mock('@/api/base44Client', () => ({ base44: { auth: {} } }));
vi.mock('@/components/hub/IntroOrb.jsx', () => ({ default: () => <div data-testid="orb" /> }));

function renderGate() {
  return render(
    <MemoryRouter>
      <FirstVisitGate onChoice={() => {}} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  try { window.sessionStorage.clear(); } catch { /* */ }
  _resetPlayAppCache();
});

describe('FirstVisitGate home features', () => {
  it('shows the "what you can do" section under the sign-in card on the website', () => {
    renderGate();
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to RockHound-GO' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'What you can do with RockHound-GO' })).toBeTruthy();
    for (const f of HOME_FEATURES) {
      expect(screen.getByRole('heading', { level: 3, name: f.title })).toBeTruthy();
    }
    expect(screen.getByRole('link', { name: 'Try the demo, no account needed' }).getAttribute('href')).toBe('/demo');
    expect(screen.getByRole('link', { name: /Sign in/ }).getAttribute('href')).toBe('/signin');
  });

  it('keeps the section around 150 words', () => {
    renderGate();
    const words = document.getElementById('home-features').textContent.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(120);
    expect(words).toBeLessThanOrEqual(175);
  });

  it('hides the section inside the Android app', () => {
    window.history.replaceState(null, '', '/?source=twa');
    renderGate();
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to RockHound-GO' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: 'What you can do with RockHound-GO' })).toBeNull();
    expect(screen.queryByRole('button', { name: /See what you can do/ })).toBeNull();
  });
});
