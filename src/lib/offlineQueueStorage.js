const STORAGE_KEY = 'rh-offline-queue-v1';
const KEY_KEY = 'rh-offline-queue-key-v1';
let cachedQueue = [];

function cryptoProvider() {
  const provider = globalThis.window?.crypto?.subtle ? window.crypto : globalThis.crypto;
  if (!provider?.subtle) throw new Error('Secure offline storage is unavailable. Your find was not saved.');
  return provider;
}
function encode(buffer) {
  return btoa(Array.from(new Uint8Array(buffer), byte => String.fromCharCode(byte)).join(''));
}
function decode(value) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}
async function storageKey(create = false) {
  const provider = cryptoProvider();
  const stored = localStorage.getItem(KEY_KEY);
  if (stored) return provider.subtle.importKey('raw', decode(stored), 'AES-GCM', false, ['encrypt', 'decrypt']);
  if (!create) throw new Error('The offline encryption key is missing. Saved finds have been left untouched.');
  const key = await provider.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  localStorage.setItem(KEY_KEY, encode(await provider.subtle.exportKey('raw', key)));
  return key;
}
function validate(items) {
  if (!Array.isArray(items) || items.some(item => !item || typeof item.entity !== 'string' || !['create', 'update'].includes(item.op) || !item.data || typeof item.data !== 'object')) {
    throw new Error('Offline storage could not be read safely. Saved finds have been left untouched.');
  }
  return items;
}
export async function loadQueue() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { cachedQueue = []; return []; }
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Offline storage could not be read safely. Saved finds have been left untouched.'); }
  if (Array.isArray(parsed)) {
    const items = validate(parsed);
    cachedQueue = items;
    return items; // Encrypt on the next serialized save, never mutate during a read.
  }
  if (parsed?.version !== 1 || !parsed.iv || !parsed.data) throw new Error('Offline storage format is not recognized. Saved finds have been left untouched.');
  const key = await storageKey();
  let plain;
  try {
    plain = await cryptoProvider().subtle.decrypt({ name: 'AES-GCM', iv: decode(parsed.iv) }, key, decode(parsed.data));
  } catch { throw new Error('Offline storage could not be unlocked. Saved finds have been left untouched.'); }
  const items = validate(JSON.parse(new TextDecoder().decode(plain)));
  cachedQueue = items;
  return items;
}
export async function saveQueue(items) {
  validate(items);
  const provider = cryptoProvider();
  const key = await storageKey(!localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)?.trim().startsWith('['));
  const iv = provider.getRandomValues(new Uint8Array(12));
  const bytes = await provider.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(items)));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, iv: encode(iv), data: encode(bytes) }));
  } catch { throw new Error('Offline storage is full or unavailable. Existing finds are safe, but this change was not saved.'); }
  cachedQueue = items;
  globalThis.window?.dispatchEvent?.(new Event('rhgo-offline-queue-change'));
}
export function getQueueLength(user) {
  return user ? cachedQueue.filter(item => belongsToUser(item, user)).length : cachedQueue.length;
}
export function belongsToUser(item, user) {
  if (!user?.id || !user?.email) return false;
  return item.ownerId ? item.ownerId === user.id && (!item.data.owner_email || item.data.owner_email === user.email) : item.data.owner_email === user.email;
}