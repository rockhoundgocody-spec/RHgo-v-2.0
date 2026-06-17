import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MapPin, X } from 'lucide-react';
import useHotspotProximity from '@/lib/useHotspotProximity';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'rh_dismissed_hotspots';
const TODAY = new Date().toDateString();

function getDismissed() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Reset daily
    if (raw.date !== TODAY) return {};
    return raw.ids || {};
  } catch { return {}; }
}

function saveDismissed(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: TODAY, ids }));
}

export default function HotspotProximityWatcher() {
  const { nearby, requestPermission, permission } = useHotspotProximity({ enabled: true });
  const [dismissedIds, setDismissedIds] = useState(() => getDismissed());
  const timerRef = useRef(null);
  const bannerRef = useRef(null);

  const dismiss = (id) => {
    const next = { ...dismissedIds, [id]: true };
    setDismissedIds(next);
    saveDismissed(next);
  };

  // Track analytics once per hotspot
  const trackedRef = useRef(null);
  useEffect(() => {
    if (nearby && nearby.hotspot.id !== trackedRef.current) {
      trackedRef.current = nearby.hotspot.id;
      base44.analytics.track({
        eventName: 'hotspot_proximity_alert',
        properties: { hotspot_name: nearby.hotspot.name, distance_m: nearby.distance_m, land_type: nearby.hotspot.land_type || 'unknown' },
      });
    }
  }, [nearby]);

  const hotspotId = nearby?.hotspot?.id;
  const visible = nearby && !dismissedIds[hotspotId];

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    if (!visible || !hotspotId) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dismiss(hotspotId), 7000);
    return () => clearTimeout(timerRef.current);
  }, [visible, hotspotId]);

  // Dismiss when user scrolls past 33% of the page
  useEffect(() => {
    if (!visible || !hotspotId) return;
    const root = document.getElementById('root') || window;
    const onScroll = () => {
      const el = root === window ? document.documentElement : root;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      if (total > 0 && scrolled / total >= 0.33) {
        dismiss(hotspotId);
      }
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [visible, hotspotId]);

  if (!visible) return null;

  const distMiles = (nearby.distance_m / 1609.34).toFixed(1);

  return (
    <div
      ref={bannerRef}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md"
      role="status"
      aria-live="polite"
    >
      <div className={cn(
        'glass-panel rounded-2xl px-4 py-3 flex items-center gap-3',
        'border border-amethyst/40 shadow-[0_0_40px_-10px_hsla(280,80%,60%,0.6)]'
      )}>
        <div className="w-10 h-10 rounded-full bg-amethyst/30 flex items-center justify-center shrink-0">
          <MapPin className="text-amethyst-glow" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst-glow">
            Hotspot Nearby · {distMiles}mi
          </div>
          <div className="text-white text-sm font-semibold truncate">
            {nearby.hotspot.name}
          </div>
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-hud hover:text-hud-cyan"
            >
              <Bell size={11} /> Enable push notifications
            </button>
          )}
        </div>
        <Link
          to="/explore"
          onClick={() => dismiss(hotspotId)}
          className="text-xs px-3 py-1.5 rounded-md bg-amethyst/30 hover:bg-amethyst/50 text-white border border-amethyst/50"
        >
          Explore
        </Link>
        <button
          onClick={() => dismiss(hotspotId)}
          className="text-white/50 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}