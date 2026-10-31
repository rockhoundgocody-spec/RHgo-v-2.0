// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pulse, isAway, alertWhenAway } from './fieldAlerts.js';

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
}

describe('fieldAlerts', () => {
  let showNotification;

  beforeEach(() => {
    setVisibility('visible');
    showNotification = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'Notification', {
      value: Object.assign(vi.fn(), { permission: 'granted' }),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.Notification;
  });

  it('reports away only when the app is not in front', () => {
    expect(isAway()).toBe(false);
    setVisibility('hidden');
    expect(isAway()).toBe(true);
  });

  it('never puts a notification up while the app is in front of the user', async () => {
    const shown = await alertWhenAway({ title: 'Clover heard you', body: 'Listening now.' });
    expect(shown).toBe(false);
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('sends to the status bar once the app is closed out', async () => {
    setVisibility('hidden');
    const shown = await alertWhenAway({ title: 'Find logged', body: 'Saved to your collection.', tag: 'find-1' });
    expect(shown).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(
      'Find logged',
      expect.objectContaining({ body: 'Saved to your collection.', tag: 'find-1' })
    );
  });

  it('falls back to a page-level notification when no worker is active', async () => {
    setVisibility('hidden');
    navigator.serviceWorker.getRegistration.mockResolvedValue(null);
    const shown = await alertWhenAway({ title: 'Wake turned away' });
    expect(shown).toBe(true);
    expect(globalThis.Notification).toHaveBeenCalledWith('Wake turned away', expect.any(Object));
  });

  it('stays silent when notification permission has not been granted', async () => {
    setVisibility('hidden');
    globalThis.Notification.permission = 'default';
    const shown = await alertWhenAway({ title: 'Find logged' });
    expect(shown).toBe(false);
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('fires one subtle pulse for an in-app confirmation', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    pulse('tap');
    expect(vibrate).toHaveBeenCalledWith(12);
  });
});