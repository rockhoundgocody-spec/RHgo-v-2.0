// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.dataLayer;
    delete window.gtag;
  });

  it('installs GTM securely using DOM methods without innerHTML', async () => {
    vi.stubEnv('VITE_GTM_ID', 'GTM-TEST1234');
    const { installGtm } = await import('./analytics.js');

    installGtm();

    const noscript = document.getElementById('rhgo-gtm-noscript');
    expect(noscript).not.toBeNull();
    expect(noscript.tagName.toLowerCase()).toBe('noscript');

    const iframe = noscript.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe('https://www.googletagmanager.com/ns.html?id=GTM-TEST1234');
    expect(iframe.getAttribute('height')).toBe('0');
    expect(iframe.getAttribute('width')).toBe('0');
    expect(iframe.style.display).toBe('none');
    expect(iframe.style.visibility).toBe('hidden');
    expect(iframe.title).toBe('gtm');
  });

  it('ignores invalid GTM ID formats to prevent script injection', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('VITE_GTM_ID', 'INVALID" onerror="alert(1)');
    const { installGtm } = await import('./analytics.js');

    installGtm();

    expect(document.getElementById('rhgo-gtm-noscript')).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[analytics] Ignoring invalid VITE_GTM_ID');
    consoleWarnSpy.mockRestore();
  });

  it('tracks page views and filters sensitive parameters in events', async () => {
    vi.stubEnv('VITE_GTM_ID', '');
    const { trackPageView, trackEvent } = await import('./analytics.js');

    trackPageView('/explore', 'Explore Minerals');
    expect(window.dataLayer).toContainEqual({
      event: 'page_view',
      page_path: '/explore',
      page_title: 'Explore Minerals',
    });

    trackEvent('find_specimen', {
      mineral: 'Quartz',
      email: 'user@example.com', // sensitive, should be filtered
      user_token: 'secret-token-123', // sensitive, should be filtered
      count: 2,
    });

    const lastEvent = window.dataLayer[window.dataLayer.length - 1];
    expect(lastEvent.mineral).toBe('Quartz');
    expect(lastEvent.count).toBe(2);
    expect(lastEvent.email).toBeUndefined();
    expect(lastEvent.user_token).toBeUndefined();
  });
});
