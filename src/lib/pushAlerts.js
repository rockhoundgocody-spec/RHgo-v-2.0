/**
 * pushAlerts — status-bar alerts that survive the app being closed.
 *
 * Page notifications (see fieldAlerts) only work while the app is alive. A
 * closed app can only be reached through a Web Push subscription, which is what
 * this module registers: it asks the browser for permission, subscribes this
 * device, and stores the device keys so the sent alert can be encrypted for it.
 *
 * The key below is the public VAPID key — public by design. The matching signer
 * stays in app secrets and never reaches the client.
 */
import { base44 } from '@/api/base44Client';

export const VAPID_PUBLIC_KEY = 'BL1nDiQgykEahlbCuEcSCGgUZBvlaQZuv80VsrFNwi-RAmhZNGAxJIxV52wAhrJ1LTYLr1YlCBbhInwpCvTLj6w';

export const ALERT_CATEGORIES = [
  { key: 'community', label: 'Community activity', hint: 'Reactions and comments on your finds' },
  { key: 'missions', label: 'Weekly missions & recap', hint: 'A fresh mission set and your week in stones' },
  { key: 'rewards', label: 'Approvals & rewards', hint: 'Verified finds, XP and level-ups' },
];

const DEFAULT_CATEGORIES = { community: true, missions: true, rewards: true };

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  );
}

function deviceLabel() {
  const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  if (/iPhone/i.test(agent)) return 'iPhone';
  if (/iPad/i.test(agent)) return 'iPad';
  if (/Android/i.test(agent)) return 'Android';
  if (/Macintosh/i.test(agent)) return 'Mac';
  if (/Windows/i.test(agent)) return 'Windows';
  return 'This device';
}

function keyBytes(base64url) {
  const normalized = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

/** The app's service worker registration, registering it if it is not live yet. */
async function registration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register('/service-worker.js');
}

async function currentSubscription() {
  if (!pushSupported()) return null;
  const worker = await registration().catch(() => null);
  if (!worker) return null;
  return worker.pushManager.getSubscription().catch(() => null);
}

async function storedRecord(endpoint) {
  if (!endpoint) return null;
  const records = await base44.entities.PushSubscription.filter({ endpoint }).catch(() => []);
  return records?.[0] || null;
}

/** What this device should show in Settings. */
export async function loadAlertState() {
  const state = {
    supported: pushSupported(),
    permission: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
    subscribed: false,
    categories: { ...DEFAULT_CATEGORIES },
    signedIn: false,
  };
  if (!state.supported) return state;

  const user = await base44.auth.me().catch(() => null);
  if (!user) return state;
  state.signedIn = true;

  const subscription = await currentSubscription();
  const record = await storedRecord(subscription?.endpoint);
  state.subscribed = Boolean(record);
  if (record?.categories) state.categories = { ...state.categories, ...record.categories };
  return state;
}

/** Turns alerts on for this device (permission + push subscription + stored keys). */
export async function enableAlerts(categories = DEFAULT_CATEGORIES) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  const user = await base44.auth.me().catch(() => null);
  if (!user) return { ok: false, reason: 'signed_out' };

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const worker = await registration();
  const existing = await worker.pushManager.getSubscription();
  const subscription = existing || (await worker.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes(VAPID_PUBLIC_KEY),
  }));

  const keys = subscription.toJSON?.()?.keys || {};
  const record = {
    owner_email: user.email,
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh || '',
    auth: keys.auth || '',
    device_label: deviceLabel(),
    categories,
  };

  const known = await storedRecord(subscription.endpoint);
  if (known) {
    await base44.entities.PushSubscription.update(known.id, {
      p256dh: record.p256dh,
      auth: record.auth,
      device_label: record.device_label,
      categories: record.categories,
    });
  } else {
    await base44.entities.PushSubscription.create(record);
  }

  return { ok: true };
}

/** Turns alerts off for this device and forgets its keys. */
export async function disableAlerts() {
  const subscription = await currentSubscription();
  if (!subscription) return { ok: true };

  const known = await storedRecord(subscription.endpoint);
  await subscription.unsubscribe().catch(() => {});
  if (known) await base44.entities.PushSubscription.delete(known.id).catch(() => {});
  return { ok: true };
}

/** Saves which alert groups this device accepts. */
export async function saveAlertCategories(categories) {
  const subscription = await currentSubscription();
  const known = await storedRecord(subscription?.endpoint);
  if (!known) return false;
  await base44.entities.PushSubscription.update(known.id, { categories });
  return true;
}

/** Sends one alert to the caller's own devices, so they can see it work. */
export async function sendTestAlert() {
  const response = await base44.functions.invoke('sendTestAlert', {});
  return response?.data || {};
}