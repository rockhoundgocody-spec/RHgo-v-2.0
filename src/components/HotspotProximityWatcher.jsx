import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MapPin, X } from 'lucide-react';
import useHotspotProximity from '@/lib/useHotspotProximity';
import { cn } from '@/lib/utils';

/**
 * Mounted globally inside Layout. Watches user position, fires a browser
 * notification when within 500m of a Hotspot, and shows an in-app banner
 * with a CTA to explore the site.
 */
export default function HotspotProximityWatcher() {
  const { nearby, requestPermission, permission } = useHotspotProximity({ enabled: true });
  const [dismissedId, setDismissedId] = useState(null);
  const [askedOnce, setAskedOnce] = useState(false);

  // One-time, low-friction prompt for notification permission.
  useEffect(() => {
    if (askedOnce) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      // Don't auto-prompt; we let the user trigger it via the banner.
    }
    setAskedOnce(true);
  }, [askedOnce]);

  if (!nearby || dismissedId === nearby.hotspot.id) return null;

  return (
    <div
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
            Hotspot Nearby · {nearby.distance_m}m
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
          className="text-xs px-3 py-1.5 rounded-md bg-amethyst/30 hover:bg-amethyst/50 text-white border border-amethyst/50"
        >
          Explore
        </Link>
        <button
          onClick={() => setDismissedId(nearby.hotspot.id)}
          className="text-white/50 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}