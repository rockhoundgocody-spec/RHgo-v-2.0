import { isConsentGranted } from '@/lib/cookieConsent';

/** Child accounts (onboarding age gate) never get analytics or session recording. */
export function isChildAccount() {
  try {
    return localStorage.getItem('rhgo_mode') === 'kid';
  } catch {
    return false;
  }
}

/** Analytics + session recording run only with accepted cookies and a non-child account. */
export function analyticsAllowed() {
  return isConsentGranted() && !isChildAccount();
}