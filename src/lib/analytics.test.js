// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('analytics module', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.dataLayer;
    delete window.gtag;
  });

  it('installGtm constructs noscript and iframe safely without innerHTML', async () => {
    vi.stubEnv('VITE_GTM_ID', 'GTM-ABC1234');
    const { installGtm } = await import('./analytics.js');

    installGtm();

    const noscript = document.getElementById('rhgo-gtm-noscript');
    expect(noscript).not.toBeNull();
    expect(noscript.tagName.toLowerCase()).toBe('noscript');

    const iframe = noscript.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe('https://www.googletagmanager.com/ns.html?id=GTM-ABC1234');
    expect(iframe.getAttribute('height')).toBe('0');
    expect(iframe.getAttribute('width')).toBe('0');
    expect(iframe.style.display).toBe('none');
    expect(iframe.style.visibility).toBe('hidden');
    expect(iframe.title).toBe('gtm');

    // Ensure double-invocation is a no-op
    installGtm();
    expect(document.querySelectorAll('#rhgo-gtm-noscript').length).toBe(1);
  });

  it('installGtm ignores invalid GTM_ID format', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('VITE_GTM_ID', 'INVALID_ID"><script>alert(1)</script>');
    const { installGtm } = await import('./analytics.js');

    installGtm();

    expect(document.getElementById('rhgo-gtm-noscript')).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('[analytics] Ignoring invalid VITE_GTM_ID');
    warnSpy.mockRestore();
  });

  it('trackEvent filters out sensitive keys like email and token', async () => {
    const { trackEvent } = await import('./analytics.js');

    trackEvent('user_action', {
      user_email: 'user@example.com',
      authToken: 'secret-token',
      latitude_lat: '45.5',
      safe_param: 'hello',
    });

    expect(window.dataLayer).toBeDefined();
    const lastEvent = window.dataLayer[window.dataLayer.length - 1];
    expect(lastEvent).toEqual({
      event: 'user_action',
      safe_param: 'hello',
    });
  });
});
