import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { installOfflineQueue } from '@/lib/offlineQueue'
import { initAnalytics } from '@/lib/analytics'

// Install offline write-replay before first render so any queued field
// writes flush as soon as the network returns.
installOfflineQueue()
initAnalytics()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register the service worker for PWA installability / Google Play TWA packaging.
// In dev, an old SW can cache-serve stale Vite chunks (with mismatched React),
// causing "Cannot read properties of null (reading 'useEffect')". So in dev we
// unregister any existing worker and clear its caches instead of registering.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => {
          if ('caches' in window) {
            return caches.keys().then((keys) =>
              Promise.all(keys.filter((k) => k.startsWith('vite') || k.startsWith('rhgo')).map((k) => caches.delete(k)))
            );
          }
        })
        .catch(() => {});
      return;
    }
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => console.warn('Service worker registration failed:', err));
  });
}