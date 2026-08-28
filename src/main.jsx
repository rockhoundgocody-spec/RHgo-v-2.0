import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { installOfflineQueue } from '@/lib/offlineQueue'

// Install offline write-replay before first render so any queued field
// writes flush as soon as the network returns.
installOfflineQueue()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register the service worker for PWA installability / Google Play TWA packaging.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => console.warn('Service worker registration failed:', err));
  });
}