// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CookieConsentBanner from './CookieConsentBanner';
import * as cookieConsent from '@/lib/cookieConsent';
import * as analytics from '@/lib/analytics';

vi.mock('@/lib/cookieConsent', async () => {
  const actual = await vi.importActual('@/lib/cookieConsent');
  return {
    ...actual,
    hasConsentChoice: vi.fn(() => false),
    setConsentGranted: vi.fn(),
    setConsentDeclined: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  };
});

vi.mock('@/lib/analytics', () => ({
  enableAnalytics: vi.fn(),
}));

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders cookie consent dialog with proper ARIA attributes and focus styles', () => {
    vi.mocked(cookieConsent.hasConsentChoice).mockReturnValue(false);

    render(<CookieConsentBanner />);

    const dialog = screen.getByRole('dialog', { name: 'Cookie consent' });
    expect(dialog).toBeTruthy();

    const acceptBtn = screen.getByRole('button', { name: 'Accept' });
    expect(acceptBtn.className).toContain('focus-visible:ring-2');
    expect(acceptBtn.className).toContain('focus-visible:ring-[#2EE6A6]');

    const declineBtn = screen.getByRole('button', { name: 'Decline' });
    expect(declineBtn.className).toContain('focus-visible:ring-2');
    expect(declineBtn.className).toContain('focus-visible:ring-[#9FE8D0]');

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss cookie consent' });
    expect(dismissBtn.getAttribute('title')).toBe('Dismiss cookie consent');
    expect(dismissBtn.className).toContain('focus-visible:ring-2');
    expect(dismissBtn.className).toContain('focus-visible:ring-[#9FE8D0]');
  });

  it('triggers consent granted and analytics when Accept is clicked', () => {
    vi.mocked(cookieConsent.hasConsentChoice).mockReturnValue(false);

    render(<CookieConsentBanner />);

    const acceptBtn = screen.getByRole('button', { name: 'Accept' });
    fireEvent.click(acceptBtn);

    expect(cookieConsent.setConsentGranted).toHaveBeenCalledTimes(1);
    expect(analytics.enableAnalytics).toHaveBeenCalledTimes(1);
  });

  it('triggers consent declined when Decline or Dismiss is clicked', () => {
    vi.mocked(cookieConsent.hasConsentChoice).mockReturnValue(false);

    render(<CookieConsentBanner />);

    const declineBtn = screen.getByRole('button', { name: 'Decline' });
    fireEvent.click(declineBtn);

    expect(cookieConsent.setConsentDeclined).toHaveBeenCalledTimes(1);
  });
});
