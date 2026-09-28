/**
 * isNativeApp — detect if the app is running inside a store app rather than a
 * browser tab. Used to gate Stripe checkout for digital subscriptions, which
 * store policies don't allow inside their apps.
 *
 * Detection signals:
 * - Google Play app (Trusted Web Activity, package me.rhgo.app): opened with
 *   `?source=twa` and/or an `android-app://` referrer. Remembered for the tab in
 *   sessionStorage — not localStorage, because the Play app shares storage with
 *   Chrome and buying must stay available in the normal browser.
 * - Android WebView: UA contains "wv)"
 * - iOS WebView: AppleWebKit without "Safari/" and without "CriOS" (Chrome)
 * - Capacitor native bridge
 */
const TWA_SESSION_KEY = 'rh_android_app';

/** Pure detector for the Google Play (TWA) app, testable without a browser. */
export function detectTwa({ search = '', referrer = '', stored = null } = {}) {
  if (stored === '1') return true;
  let source = null;
  try {
    source = new URLSearchParams(search).get('source');
  } catch {
    source = null;
  }
  if (source === 'twa') return true;
  return typeof referrer === 'string' && referrer.startsWith('android-app://');
}

let twaCached = null;

export function isPlayApp() {
  if (twaCached !== null) return twaCached;
  if (typeof window === 'undefined') return false;
  let stored = null;
  try {
    stored = window.sessionStorage.getItem(TWA_SESSION_KEY);
  } catch {
    stored = null;
  }
  twaCached = detectTwa({
    search: window.location.search,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    stored,
  });
  if (twaCached) {
    try {
      window.sessionStorage.setItem(TWA_SESSION_KEY, '1');
    } catch {
      /* storage unavailable: detection still works for this page load */
    }
  }
  return twaCached;
}

export function isNativeApp() {
  if (isPlayApp()) return true;
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Android WebView
  if (/Android/.test(ua) && /wv\)/.test(ua)) return true;
  // iOS WebView (AppleWebKit but not Safari, not Chrome on iOS)
  if (/(iPhone|iPad|iPod)/.test(ua) && /AppleWebKit/.test(ua) && !/Safari\//.test(ua) && !/CriOS/.test(ua)) return true;
  // Capacitor / native bridge
  if (typeof window !== 'undefined' && window.Capacitor?.isNative) return true;
  return false;
}

/** Test helper: forget the cached Play-app answer. */
export function _resetPlayAppCache() {
  twaCached = null;
}
