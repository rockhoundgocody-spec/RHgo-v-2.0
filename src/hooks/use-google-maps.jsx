import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useGoogleMaps() {
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps);
  const [apiKey, setApiKey] = useState(null);

  // Fetch the Maps API key
  useEffect(() => {
    base44.functions.invoke('getMapsKey', {})
      .then((r) => setApiKey(r?.data?.apiKey))
      .catch((err) => {
        console.error('Failed to fetch Google Maps API key:', err);
      });
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps?.Map) {
      setMapsReady(true);
      return;
    }

    // Reuse existing script if available
    const existing = document.querySelector('script[data-rockhound-gmaps]');

    if (existing) {
      const poll = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(poll);
          setMapsReady(true);
        }
      }, 100);
      return () => clearInterval(poll);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places,geometry`;
    script.async = true;
    script.dataset.rockhoundGmaps = '1';
    script.onload = () => setMapsReady(true);
    document.head.appendChild(script);
  }, [apiKey]);

  return { mapsReady, apiKey };
}
