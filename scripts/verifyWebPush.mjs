/**
 * Verifies the Web Push envelope used for status-bar alerts (run with: node scripts/verifyWebPush.mjs).
 *
 * The alert is decrypted the way a subscriber's device would, which is what
 * proves a sent alert is readable on a phone rather than merely well-formed.
 * This lives outside src/ because the app bundle may not import server code,
 * and outside base44/ because those modules may not import a test runner.
 */
import assert from 'node:assert/strict';
import { encryptPayload, vapidAuthorization } from '../base44/shared/webPush.ts';

const encoder = new TextEncoder();

function toB64url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hkdf(salt, input, info, length) {
  const key = await crypto.subtle.importKey('raw', input, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8);
  return new Uint8Array(bits);
}

async function makeDevice() {
  const keys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const publicBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return {
    keys,
    publicBytes,
    auth,
    subscription: { endpoint: 'https://push.example.test/device', p256dh: toB64url(publicBytes), auth: toB64url(auth) },
  };
}

async function decryptAsDevice(body, device) {
  const salt = body.slice(0, 16);
  const keyIdLength = body[20];
  const serverPublic = body.slice(21, 21 + keyIdLength);
  const ciphertext = body.slice(21 + keyIdLength);

  const serverKey = await crypto.subtle.importKey('raw', serverPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: serverKey }, device.keys.privateKey, 256),
  );

  const ikm = await hkdf(device.auth, sharedSecret, concat(encoder.encode('WebPush: info\0'), device.publicBytes, serverPublic), 32);
  const contentKey = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);

  const aesKey = await crypto.subtle.importKey('raw', contentKey, 'AES-GCM', false, ['decrypt']);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, aesKey, ciphertext));
  return new TextDecoder().decode(plain.slice(0, plain.length - 1));
}

const checks = [];

// 1: a real alert decrypts on the device it was built for
const device = await makeDevice();
const alert = { title: 'Find approved', body: 'Red beryl is verified', url: '/collection' };
const envelope = await encryptPayload(device.subscription, JSON.stringify(alert));
const decoded = JSON.parse(await decryptAsDevice(envelope, device));
assert.equal(decoded.title, alert.title);
assert.equal(decoded.body, alert.body);
assert.equal(decoded.url, alert.url);
checks.push('alert decrypts on its device');

// 2: header layout a push service expects
assert.equal(envelope[20], 65);
assert.equal(envelope.slice(21, 86).length, 65);
assert.ok(envelope.length > 91);
checks.push('aes128gcm header layout');

// 3: two identical alerts never share an envelope
const again = await encryptPayload(device.subscription, JSON.stringify(alert));
assert.notEqual(toB64url(again), toB64url(envelope));
assert.equal(JSON.parse(await decryptAsDevice(again, device)).title, alert.title);
checks.push('fresh salt per alert');

// 4: another device cannot read it
const stranger = await makeDevice();
await assert.rejects(decryptAsDevice(envelope, stranger));
checks.push('unreadable by another device');

// 5: the VAPID token — the part a push service validates before it accepts an
// alert at all. Must carry the endpoint's origin, an expiry, and a signature
// that verifies against the public key the client ships.
const signer = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const signerPublic = new Uint8Array(await crypto.subtle.exportKey('raw', signer.publicKey));
const signerJwk = await crypto.subtle.exportKey('jwk', signer.privateKey);
const publicKey = toB64url(signerPublic);

const header = await vapidAuthorization('https://fcm.googleapis.com/fcm/send/abc123', publicKey, signerJwk.d);
const parsed = /^vapid t=([^,]+), k=(.+)$/.exec(header);
assert.ok(parsed, 'authorization header shape');
assert.equal(parsed[2], publicKey);

const [jwtHeader, jwtClaims, jwtSignature] = parsed[1].split('.');
const claims = JSON.parse(Buffer.from(jwtClaims, 'base64url').toString());
assert.equal(claims.aud, 'https://fcm.googleapis.com');
assert.ok(claims.exp * 1000 > Date.now(), 'token must still be valid');
assert.equal(JSON.parse(Buffer.from(jwtHeader, 'base64url').toString()).alg, 'ES256');

const signatureValid = await crypto.subtle.verify(
  { name: 'ECDSA', hash: 'SHA-256' },
  signer.publicKey,
  fromB64url(jwtSignature),
  encoder.encode(`${jwtHeader}.${jwtClaims}`),
);
assert.equal(signatureValid, true);
checks.push('VAPID token verifies against the published key');

console.log(`webPush envelope verified: ${checks.length}/${checks.length} checks passed`);
checks.forEach((check) => console.log(`  ✓ ${check}`));