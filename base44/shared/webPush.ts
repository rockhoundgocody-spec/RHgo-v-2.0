/**
 * webPush — status-bar alerts for a closed app.
 *
 * A closed app cannot be reached by page code at all: browsers only wake it
 * through a push message delivered by the device's push service. This module
 * builds that message (RFC 8291 aes128gcm payload + VAPID signature) and sends
 * it. The signing key lives in app secrets and never reaches the client — only
 * the public VAPID key does, which is public by design.
 *
 * Every entry point fails soft: an alert that cannot be delivered must never
 * break the flow that triggered it.
 */

export interface PushSubscriptionRecord {
  id?: string;
  p256dh: string;
  auth: string;
  endpoint: string;
  categories?: Record<string, boolean>;
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

export interface PushAlertOptions {
  category?: string;
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

export interface PushResult {
  delivered: number;
  failed: number;
  skipped?: string;
  devices?: number;
  error?: string;
}

export interface Base44Client {
  asServiceRole: {
    entities: {
      PushSubscription: {
        filter: (query: Record<string, unknown>) => Promise<PushSubscriptionRecord[] | null>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        delete: (id: string) => Promise<unknown>;
      };
    };
  };
}

const encoder = new TextEncoder();

function b64urlToBytes(value: string): Uint8Array {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function uint32(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]);
}

async function hkdf(salt: Uint8Array, input: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', input, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

/** Encrypts one alert for one device (RFC 8291, aes128gcm). */
export async function encryptPayload(subscription: PushSubscriptionRecord, payloadText: string): Promise<Uint8Array> {
  const devicePublic = b64urlToBytes(subscription.p256dh);
  const authSecret = b64urlToBytes(subscription.auth);

  const ephemeral = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const ephemeralPublic = new Uint8Array(await crypto.subtle.exportKey('raw', ephemeral.publicKey));
  const deviceKey = await crypto.subtle.importKey('raw', devicePublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: deviceKey }, ephemeral.privateKey, 256),
  );

  const keyInfo = concatBytes(encoder.encode('WebPush: info\0'), devicePublic, ephemeralPublic);
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const contentKey = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);

  const aesKey = await crypto.subtle.importKey('raw', contentKey, 'AES-GCM', false, ['encrypt']);
  const record = concatBytes(encoder.encode(payloadText), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, record),
  );

  return concatBytes(salt, uint32(4096), new Uint8Array([ephemeralPublic.length]), ephemeralPublic, ciphertext);
}

/** The VAPID token a push service verifies before accepting an alert. */
export async function vapidAuthorization(endpoint: string, publicKey: string, privateKey: string): Promise<string> {
  const publicBytes = b64urlToBytes(publicKey);
  const header = bytesToB64url(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = bytesToB64url(encoder.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: 'https://rhgo.me',
  })));
  const signingInput = `${header}.${claims}`;

  const signer = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      ext: true,
      d: privateKey,
      x: bytesToB64url(publicBytes.slice(1, 33)),
      y: bytesToB64url(publicBytes.slice(33, 65)),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signer, encoder.encode(signingInput)),
  );

  return `vapid t=${signingInput}.${bytesToB64url(signature)}, k=${publicKey}`;
}

/** Posts one encrypted alert to a device's push service. */
export async function deliverPush(subscription: PushSubscriptionRecord, payload: PushPayload, keys: VapidKeys): Promise<Response> {
  const body = await encryptPayload(subscription, JSON.stringify(payload));
  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '4320',
      Urgency: 'normal',
      Authorization: await vapidAuthorization(subscription.endpoint, keys.publicKey, keys.privateKey),
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
}

/**
 * Sends one alert to every device the user has opted in on.
 * `alert.category` selects the groups a device accepts; omit it to ignore
 * categories (used by the test alert). Devices the push service reports as
 * gone (404/410) are removed.
 */
export async function sendPushToEmail(base44: Base44Client, email: string, alert: PushAlertOptions): Promise<PushResult> {
  try {
    if (!email) return { delivered: 0, failed: 0 };

    // @ts-ignore Deno.env is available in Deno environment
    const publicKey = typeof Deno !== 'undefined' ? Deno.env.get('VAPID_PUBLIC_KEY') : undefined;
    // @ts-ignore Deno.env is available in Deno environment
    const privateKey = typeof Deno !== 'undefined' ? Deno.env.get('VAPID_PRIVATE_KEY') : undefined;
    if (!publicKey || !privateKey) return { delivered: 0, failed: 0, skipped: 'push keys not configured' };

    const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ owner_email: email });
    const targets = (subscriptions || []).filter(
      (subscription: PushSubscriptionRecord) => !alert.category || subscription.categories?.[alert.category] !== false,
    );

    let delivered = 0;
    let failed = 0;

    for (const subscription of targets) {
      try {
        const response = await deliverPush(
          subscription,
          {
            title: alert.title,
            body: alert.body || '',
            url: alert.url || '/',
            tag: alert.tag || 'rhgo-alert',
          },
          { publicKey, privateKey },
        );

        if (response.ok) {
          delivered += 1;
          if (subscription.id) {
            await base44.asServiceRole.entities.PushSubscription.update(subscription.id, {
              last_alert_at: new Date().toISOString(),
            }).catch(() => {});
          }
          continue;
        }

        failed += 1;
        if ((response.status === 404 || response.status === 410) && subscription.id) {
          await base44.asServiceRole.entities.PushSubscription.delete(subscription.id).catch(() => {});
        }
      } catch {
        failed += 1;
      }
    }

    return { delivered, failed, devices: targets.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { delivered: 0, failed: 0, error: message };
  }
}
