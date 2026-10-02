import React, { useMemo } from 'react';
import { Filter, Mountain, MapPin, Navigation } from 'lucide-react';

const MILES_PER_METER = 0.000621371;
const RADIUS_MILES = 500;

function haversineMiles(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * MILES_PER_METER;
}

const GUIDANCE_CARDS = [
  {
    icon: Filter,
    title: 'Filter by land type',
    desc: 'Narrow to public, fee, or permit-only sites.',
    action: 'filter',
  },
  {
    icon: Mountain,
    title: 'Check land status',
    desc: 'Verify access rules before you drive out.',
    action: 'land',
  },
  {
    icon: MapPin,
    title: 'Save a pin from a find',
    desc: 'Scan a specimen to drop a private map pin.',
    action: 'scan',
  },
];

/**
 * ExploreEmptyState — adaptive panel shown when no hotspots are near the user.
 * Shows 3 nearest real verified hotspots if any exist within 500 miles.
 * Falls back to guidance cards (no invented counts, no "nearby" bait).
 */
export default function ExploreEmptyState({ hotspots, userLocation, onSelectHotspot, onAction }) {
  const nearest = useMemo(() => {
    if (!userLocation || !hotspots?.length) return [];

    // Bolt Optimization: Perform a single-pass O(N) scan to maintain the top 3 nearest hotspots.
    // This avoids O(N log N) full array sorting, array cloning, and intermediate map/filter allocations per render.
    const top3 = [];
    for (let i = 0; i < hotspots.length; i++) {
      const h = hotspots[i];
      if (!h || h.lat == null || h.lng == null) continue;
      const dist = haversineMiles(userLocation, h);
      const item = { ...h, _dist: dist };

      if (top3.length < 3) {
        top3.push(item);
        top3.sort((a, b) => a._dist - b._dist);
      } else if (dist < top3[2]._dist) {
        top3[2] = item;
        top3.sort((a, b) => a._dist - b._dist);
      }
    }
    return top3;
  }, [hotspots, userLocation]);

  const hasNearby = nearest.length > 0 && nearest[0]._dist <= RADIUS_MILES;

  if (hasNearby) {
    return (
      <div className="pointer-events-auto">
        <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 px-1">
          Nearest verified spots
        </div>
        <div className="space-y-2">
          {nearest.map(h => (
            <button
              key={h.id}
              onClick={() => onSelectHotspot(h)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(145deg,hsla(255,30%,12%,.85),hsla(240,25%,7%,.9))',
                border: '1px solid hsla(270,30%,40%,.2)',
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'hsla(265,40%,20%,.6)', border: '1px solid hsla(265,60%,50%,.2)' }}>
                <Navigation size={14} className="text-amethyst-glow" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-[13px] leading-tight truncate">{h.name}</div>
                <div className="text-white/45 text-[11px] mt-0.5">
                  {h.state || '—'} · {(h.land_type || 'unknown').replace(/_/g, ' ')}
                </div>
              </div>
              <div className="text-white/50 text-[11px] tabular-nums shrink-0">
                {Math.round(h._dist)} mi
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto">
      <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 px-1">
        {userLocation ? 'No verified spots nearby' : 'Explore guide'}
      </div>
      <div className="space-y-2">
        {GUIDANCE_CARDS.map(card => (
          <button
            key={card.action}
            onClick={() => onAction(card.action)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(145deg,hsla(255,30%,12%,.85),hsla(240,25%,7%,.9))',
              border: '1px solid hsla(255,30%,40%,.15)',
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'hsla(255,30%,16%,.6)', border: '1px solid hsla(255,30%,40%,.15)' }}>
              <card.icon size={14} className="text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white/80 font-medium text-[13px] leading-tight">{card.title}</div>
              <div className="text-white/35 text-[11px] mt-0.5 leading-snug">{card.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}