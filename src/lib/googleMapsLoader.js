import { base44 } from '@/api/base44Client';

/**
 * googleMapsLoader — loads the new Google Maps JavaScript API once
 * (v=weekly, loading=async, marker library for AdvancedMarkerElement).
 * Key comes from VITE_GOOGLE_MAPS_API_KEY or the getMapsKey backend function.
 */
let loaderPromise = null;

export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = (async () => {
    let key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      const res = await base44.functions.invoke('getMapsKey', {}).catch(() => null);
      key = res?.data?.key;
    }
    if (!key) throw new Error('No Google Maps API key available');

    await new Promise((resolve, reject) => {
      window.__rhgoMapsReady = resolve;
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=marker&loading=async&callback=__rhgoMapsReady`;
      s.async = true;
      s.onerror = () => reject(new Error('Google Maps script failed to load'));
      document.head.appendChild(s);
    });

    return window.google.maps;
  })();

  // Allow a retry on failure instead of caching the rejection forever.
  loaderPromise.catch(() => { loaderPromise = null; });
  return loaderPromise;
}