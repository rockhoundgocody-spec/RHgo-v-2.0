/**
 * RockHound-GO Service Worker
 * Required for PWA installability / Google Play TWA packaging.
 * Strategy:
 *   install  → pre-cache the app shell
 *   activate → purge stale caches
 *   fetch    → network-first for navigations (HTML) + API calls,
 *              cache-first for hashed static assets (immutable by hash)
 */
const SHELL_CACHE = 'rhgo-shell-v2';
const SHELL_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        // Purge every old shell cache so stale index.html / bundles are evicted.
        Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Network-first for API / backend function calls — field data must stay fresh.
  if (url.pathname.startsWith('/functions/') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Network-first for navigations (HTML documents) — guarantees the newest
  // index.html, which references the newest hashed bundle. Falling back to
  // cache only when offline. This is what stops stale UI (e.g. removed debug
  // buttons) from persisting after a deploy.
  if (req.mode === 'navigate' || (url.origin === self.location.origin && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Cache-first for same-origin static assets (hashed bundles are immutable).
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.ok && res.type === 'basic') {
              const copy = res.clone();
              caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached)
      })
    );
  }
});
