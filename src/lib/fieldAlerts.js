/**
 * fieldAlerts — the field-quiet feedback layer.
 *
 * In front of the user, Clover confirms with a subtle haptic pulse and puts
 * nothing on screen. Away from the app (backgrounded or closed out), the same
 * moment becomes a status-bar notification instead, so it is waiting for them
 * without ever covering the field screen.
 */
import { triggerOrbHaptic } from '@/lib/orbAudio';

const ICON = '/favicon.ico';

/** Subtle haptic pulse — the silent "got it". */
export function pulse(pattern = 'tap') {
  triggerOrbHaptic(pattern);
}

/** True when the app is not in front of the user. */
export function isAway() {
  if (typeof document === 'undefined') return false;
  return document.visibilityState !== 'visible';
}

/**
 * Status-bar notification. Deliberately inert while the app is in front of the
 * user: the haptic already confirmed it and nothing should cover the screen.
 * Returns whether a notification actually reached the status bar.
 */
export async function alertWhenAway({ title, body, tag, variant = 'clover' } = {}) {
  if (!isAway()) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;

  const options = {
    body,
    tag: tag || `clover-${variant}`,
    icon: ICON,
    badge: ICON,
  };

  try {
    const registration = await navigator.serviceWorker?.getRegistration?.();
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch {
    // No active worker (e.g. dev) — fall through to the page-level path.
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}