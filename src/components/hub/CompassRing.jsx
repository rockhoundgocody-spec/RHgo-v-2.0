import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useDeviceOrientation from '@/lib/useDeviceOrientation';
import usePageVisible from '@/lib/usePageVisible';

/**
 * CompassRing — thin animated arc around the well that points toward the
 * nearest legal hotspot, using device geolocation + heading. Uses bearing
 * formula to compute angle. Falls back to a slow rotation if no geo/heading.
 */
export default function CompassRing({ size = 460 }) {
  const [bearing, setBearing] = useState(null);
  const [distance, setDistance] = useState(null);
  const [hotspotName, setHotspotName] = useState(null);
  const headingRef = useRef(0);
  const targetRotRef = useRef(0);
  const elRef = useRef(null);

  // Compute bearing from user → nearest hotspot
  useEffect(() => {
    let cancelled = false;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const { latitude: lat1, longitude: lng1 } = pos.coords;
        const hotspots = await base44.entities.Hotspot.list();
        if (!hotspots?.length) return;
        let nearest = null;
        let minD = Infinity;
        for (const h of hotspots) {
          if (h.lat == null || h.lng == null) continue;
          const d = haversine(lat1, lng1, h.lat, h.lng);
          if (d < minD) { minD = d; nearest = h; }
        }
        if (!nearest) return;
        const b = bearingDeg(lat1, lng1, nearest.lat, nearest.lng);
        setBearing(b);
        setDistance(minD);
        setHotspotName(nearest.name);
      },
      () => {},
      { timeout: 5000, maximumAge: 60000 }
    );
    return () => { cancelled = true; };
  }, []);

  // Device heading (where the phone is pointing) — shared singleton listener
  const onOrient = useCallback((e) => {
    const heading =
      e.webkitCompassHeading != null ? e.webkitCompassHeading : (360 - (e.alpha || 0));
    headingRef.current = heading;
  }, []);
  useDeviceOrientation(onOrient);

  const visible = usePageVisible();

  // Smooth rotate the marker toward (bearing - heading)
  useEffect(() => {
    if (!visible) return;
    let raf;
    let current = 0;
    const tick = () => {
      const target = bearing == null ? (performance.now() * 0.02) % 360 : bearing - headingRef.current;
      let delta = ((target - current + 540) % 360) - 180;
      current += delta * 0.08;
      if (elRef.current) {
        elRef.current.style.transform = `rotate(${current}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [bearing, visible]);

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div ref={elRef} className="absolute inset-0" style={{ willChange: 'transform' }}>
        {/* Subtle directional glow — soft halo bloom at the top edge */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3"
          style={{
            width: 90,
            height: 30,
            background:
              'radial-gradient(ellipse at center, hsla(155,90%,65%,0.55) 0%, hsla(155,90%,55%,0.25) 35%, transparent 75%)',
            filter: 'blur(8px)',
            opacity: bearing == null ? 0.35 : 0.85,
          }}
        />
      </div>
      {/* Distance pill — only when we actually have a hotspot lock */}
      {bearing != null && hotspotName && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-12 px-3 py-1 rounded-full glass-panel text-[9px] font-mono uppercase tracking-[0.3em] text-emerald-300/90 whitespace-nowrap"
        >
          ◇ {hotspotName} · {formatKm(distance)}
        </div>
      )}
    </div>
  );
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function bearingDeg(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function formatKm(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 100) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}