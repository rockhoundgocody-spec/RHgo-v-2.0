import { base44 } from '@/api/base44Client';
import { belongsToUser, loadQueue, saveQueue } from '@/lib/offlineQueueStorage';
export { belongsToUser, loadQueue, saveQueue, getQueueLength } from '@/lib/offlineQueueStorage';

let chain = Promise.resolve();
const deletingAccounts = new Set();
export function pauseAccountSync(userId, paused = true) {
  if (paused) deletingAccounts.add(userId); else deletingAccounts.delete(userId);
  return locked(async () => {}); // Wait for any in-flight local replay before account removal.
}
export function removeAccountQueue(user) {
  return locked(async () => {
    const queue = await loadQueue();
    await saveQueue(queue.filter(item => !belongsToUser(item, user)));
  });
}
function locked(work) {
  const run = () => globalThis.navigator?.locks?.request
    ? navigator.locks.request('rhgo-offline-writes', work) : work();
  const result = chain.then(run, run);
  chain = result.catch(() => {});
  return result;
}
const online = () => globalThis.navigator?.onLine !== false;
async function readSession() {
  let timer;
  try {
    return await Promise.race([base44.auth.me(), new Promise(resolve => { timer = setTimeout(() => resolve(null), 6000); })]);
  } catch { return null; }
  finally { clearTimeout(timer); }
}
let retryTimer = null;
let installed = false;

async function replay(queue, user, retryBlocked = false) {
  let flushed = 0;
  const results = {};
  for (const item of [...queue]) {
    if (deletingAccounts.has(user?.id) || !belongsToUser(item, user) || (item.blocked && !retryBlocked)) continue;
    const session = await readSession();
    if (deletingAccounts.has(user.id) || !session || session.id !== user.id || session.email !== user.email) break;
    const entity = base44.entities[item.entity];
    try {
      if (!entity || !['create', 'update'].includes(item.op)) throw new Error('This find needs manual recovery.');
      let result;
      if (item.op === 'create') {
        if (item.entity === 'PrivateRockLog' && item.data.offline_write_id) {
          const matches = await entity.filter({ owner_email: user.email, offline_write_id: item.data.offline_write_id }, '-created_date', 1);
          result = matches[0];
        }
        result ||= await entity.create(item.data);
      } else result = await entity.update(item.id, item.data);
      const remaining = queue.filter(entry => entry !== item);
      await saveQueue(remaining);
      queue = remaining;
      flushed++;
      if (item.queueId) results[item.queueId] = result;
    } catch (error) {
      const status = error?.status ?? error?.response?.status;
      const attempts = (item.attempts || 0) + 1;
      const blocked = !entity || (status >= 400 && status < 500 && ![408, 429].includes(status)) || attempts >= 5;
      const updated = { ...item, attempts, blocked, lastError: blocked ? 'Sync paused. Retry or export this find from Settings.' : 'Waiting for a connection. Your find is still saved on this device.' };
      const next = queue.map(entry => entry === item ? updated : entry);
      await saveQueue(next);
      queue = next;
      if (!blocked) break;
    }
  }
  return { flushed, remaining: queue.length, blocked: queue.filter(item => belongsToUser(item, user) && item.blocked).length, results };
}
async function syncLocked(retryBlocked = false) {
  const queue = await loadQueue();
  if (!online() || !queue.length) return { flushed: 0, remaining: queue.length, blocked: 0, results: {} };
  const user = await readSession();
  if (!user) return { flushed: 0, remaining: queue.length, blocked: 0, results: {} };
  return replay(queue, user, retryBlocked);
}
export function flushQueue({ retryBlocked = false } = {}) {
  return locked(async () => {
    const { results: _results, ...status } = await syncLocked(retryBlocked);
    return status;
  });
}
export function queueWrite({ entity, op = 'create', id, data, ownerId }) {
  return locked(async () => {
    let user = !ownerId && online() ? await readSession() : null;
    const userId = ownerId || user?.id;
    if (deletingAccounts.has(userId)) throw new Error('Account deletion is in progress. New finds cannot be saved.');
    if (!userId || !data?.owner_email) throw new Error('Sign in before saving a private offline find.');
    if (user && (user.id !== userId || user.email !== data.owner_email)) throw new Error('This find belongs to a different account.');
    const queueId = crypto.randomUUID();
    const payload = entity === 'PrivateRockLog' && op === 'create' ? { ...data, offline_write_id: queueId } : data;
    const item = { queueId, ownerId: userId, entity, op, id, data: payload, queuedAt: Date.now() };
    const queue = await loadQueue();
    await saveQueue([...queue, item]);
    schedulePeriodicRetry();
    if (online()) user = await readSession();
    if (user && user.id === userId && user.email === data.owner_email) {
      const status = await replay([...queue, item], user);
      if (status.results[queueId]) return { ok: true, offline: false, result: status.results[queueId] };
    }
    return { ok: true, offline: true };
  });
}
export function flushWhenStable() { return flushQueue(); }
function notifyFailure(error) {
  globalThis.window?.dispatchEvent?.(new CustomEvent('rhgo-offline-queue-error', { detail: error.message }));
}
function schedulePeriodicRetry() {
  if (retryTimer || typeof window === 'undefined') return;
  retryTimer = setInterval(async () => {
    try {
      const result = await flushQueue();
      if (!result.remaining) { clearInterval(retryTimer); retryTimer = null; }
    } catch (error) { notifyFailure(error); }
  }, 30000);
}
export function installOfflineQueue() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const resume = () => { flushQueue().catch(notifyFailure); };
  loadQueue().then(items => { if (items.length) schedulePeriodicRetry(); }).catch(notifyFailure);
  window.addEventListener('online', resume);
  window.addEventListener('storage', event => { if (event.key === 'rh-offline-queue-v1') resume(); });
  setTimeout(resume, 2000);
}