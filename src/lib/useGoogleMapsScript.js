import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useGoogleMapsScript() {
  const [mapsReady, setMapsReady] = useState(() => !!globalThis.window?.google?.maps?.Map);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined' && window.GOOGLE_MAPS_API_KEY) return window.GOOGLE_MAPS_API_KEY;
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return null;
  });
  const [loadError, setLoadError] = useState(false);

  // Fetch the Maps API key if not already set
  useEffect(() => {
    if (apiKey) return;
    base44.functions.invoke('getMapsKey', {})
      .then((r) => {
        const key = r?.data?.apiKey || r?.data?.key;
        if (key) setApiKey(key);
        else setLoadError(true);
      })
      .catch(() => setLoadError(true));
  }, [apiKey]);

  // Load Google Maps script or poll for existing script loading completion
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps?.Map) {
      setMapsReady(true);
      return;
    }
    const existing = document.querySelector('script[data-rockhound-gmaps]');
    if (existing) {
      let attempts = 0;
      const poll = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(poll);
          setMapsReady(true);
        } else if (++attempts >= 100) {
          clearInterval(poll);
          setLoadError(true);
        }
      }, 100);
      return () => clearInterval(poll);
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places,geometry`;
    script.async = true;
    script.dataset.rockhoundGmaps = '1';
    script.onload = () => setMapsReady(true);
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);
  }, [apiKey]);

  return { mapsReady, apiKey, loadError };
}
