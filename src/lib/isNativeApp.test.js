import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectTwa, isNativeApp, _resetPlayAppCache } from './isNativeApp';

describe('detectTwa', () => {
  it('detects the Play app from its start URL, referrer or remembered flag', () => {
    expect(detectTwa({ search: '?source=twa' })).toBe(true);
    expect(detectTwa({ referrer: 'android-app://me.rhgo.app/' })).toBe(true);
    expect(detectTwa({ stored: '1' })).toBe(true);
  });

  it('a normal browser visit is not the Play app', () => {
    expect(detectTwa({})).toBe(false);
    expect(detectTwa({ search: '?source=pwa' })).toBe(false);
    expect(detectTwa({ referrer: 'https://www.google.com/' })).toBe(false);
  });
});

describe('isNativeApp in the Play app', () => {
  const original = window.location.href;

  beforeEach(() => {
    _resetPlayAppCache();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.history.replaceState(null, '', original);
    window.sessionStorage.clear();
    _resetPlayAppCache();
  });

  it('remembers Play-app mode for the tab after the start URL', () => {
    window.history.replaceState(null, '', '/?source=twa');
    expect(isNativeApp()).toBe(true);
    expect(window.sessionStorage.getItem('rh_android_app')).toBe('1');

    // Later navigation without the query string still counts (new page load).
    _resetPlayAppCache();
    window.history.replaceState(null, '', '/pricing');
    expect(isNativeApp()).toBe(true);
  });

  it('is off in a normal browser tab and never writes to localStorage', () => {
    window.history.replaceState(null, '', '/pricing');
    expect(isNativeApp()).toBe(false);
    expect(window.localStorage.getItem('rh_android_app')).toBe(null);
  });
});
