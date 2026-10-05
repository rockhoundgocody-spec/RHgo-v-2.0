/**
 * Analytics consent gate for rhgo.me.
 *
 * GA/GTM must not load or fire until the user accepts. The choice is persisted
 * in localStorage so the banner only renders once per browser. Until consent
 * is granted, no GA/GTM network calls happen at all.
 *
 * Values: 'granted' | 'declined' | null (no choice yet)
 */

const CONSENT_KEY = 'rhgo_analytics_consent';

/** @returns {'granted'|'declined'|null} */
export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function hasConsentChoice() {
  return getConsent() !== null;
}

export function isConsentGranted() {
  return getConsent() === 'granted';
}

export function setConsentGranted() {
  try { localStorage.setItem(CONSENT_KEY, 'granted'); } catch {}
  notify();
}

export function setConsentDeclined() {
  try { localStorage.setItem(CONSENT_KEY, 'declined'); } catch {}
  notify();
}

// Lightweight pub/sub so the banner can close itself and analytics can react
// when consent flips to granted from the banner's accept button.
const listeners = new Set();
export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notify() {
  listeners.forEach((cb) => {
    try { cb(); } catch {}
  });
}