import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Haversine distance in meters
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

const RADIUS_M = 500;
const NOTIFY_COOLDOWN_MS = 15 * 60 * 1000; // don't re-notify the same hotspot for 15 min

/**
 * useHotspotProximity — watches the user's location and fires a browser
 * push notification + in-app event when they enter within 500m of any
 * known Hotspot.
 *
 * Returns { nearby, requestPermission, permission }.
 */
export default function useHotspotProximity({ enabled = true } = {}) {
  const [nearby, setNearby] = useState(null);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const hotspotsRef = useRef([]);
  const lastNotifiedRef = useRef({}); // { [hotspotId]: timestamp }

  // Load hotspots once
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    base44.entities.Hotspot.list().then((list) => {
      if (!cancelled) {
        hotspotsRef.current = (list || []).filter(
          (h) => typeof h.lat === 'number' && typeof h.lng === 'number'
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Watch position
  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let closest = null;
        let closestDist = Infinity;
        for (const h of hotspotsRef.current) {
          const d = distanceMeters(me, { lat: h.lat, lng: h.lng });
          if (d < closestDist) {
            closestDist = d;
            closest = h;
          }
        }

        if (closest && closestDist <= RADIUS_M) {
          const payload = { hotspot: closest, distance_m: Math.round(closestDist) };
          setNearby(payload);

          // Fire a browser push notification (with cooldown per hotspot)
          const now = Date.now();
          const last = lastNotifiedRef.current[closest.id] || 0;
          if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted' &&
            now - last > NOTIFY_COOLDOWN_MS
          ) {
            try {
              new Notification('🪨 RockHound nearby!', {
                body: `${closest.name} is ${Math.round(closestDist)}m away. Tap to explore.`,
                tag: `hotspot-${closest.id}`,
                icon: '/favicon.ico',
              });
              lastNotifiedRef.current[closest.id] = now;
            } catch {
              /* noop */
            }
          }
        } else {
          setNearby(null);
        }
      },
      () => {
        /* silently ignore — user may have denied */
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 30_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return { nearby, requestPermission, permission };
}