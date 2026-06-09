/**
 * ExpeditionPlanner — AI-powered route builder based on collection gaps.
 * Suggests an ordered list of hotspots to visit for missing minerals.
 */
import React, { useMemo, useState } from 'react';
import { Route, Zap, ChevronRight, MapPin, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Nearest-neighbour TSP from origin
function planRoute(origin, hotspots, limit = 6) {
  if (!origin || hotspots.length === 0) return [];
  let remaining = [...hotspots];
  let current   = origin;
  const route   = [];
  while (remaining.length > 0 && route.length < limit) {
    remaining.sort((a, b) => haversineKm(current, a) - haversineKm(current, b));
    const next = remaining.shift();
    route.push(next);
    current = next;
  }
  return route;
}

export default function ExpeditionPlanner({
  hotspots      = [],
  specimens     = [],
  userLocation  = null,
  onRouteChange,
  onHotspotFocus,
}) {
  const [open, setOpen] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [route, setRoute] = useState([]);

  // Collection gaps: minerals present in hotspots but missing from user's collection
  const collectedMinerals = useMemo(() => {
    return new Set(specimens.map(s => (s.mineral_name || '').toLowerCase().trim()).filter(Boolean));
  }, [specimens]);

  const gapHotspots = useMemo(() => {
    return hotspots.filter(h => {
      if (!h.lat || !h.lng) return false;
      return (h.minerals || []).some(m => !collectedMinerals.has(m.toLowerCase()));
    });
  }, [hotspots, collectedMinerals]);

  const gapMineralCounts = useMemo(() => {
    const map = {};
    gapHotspots.forEach(h => {
      (h.minerals || []).forEach(m => {
        if (!collectedMinerals.has(m.toLowerCase())) {
          map[m] = (map[m] || 0) + 1;
        }
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [gapHotspots, collectedMinerals]);

  function handlePlan() {
    setPlanning(true);
    setTimeout(() => {
      const origin = userLocation || (hotspots.find(h => h.lat) ? { lat: hotspots[0].lat, lng: hotspots[0].lng } : null);
      // Prioritise gap hotspots by missing mineral count
      const scored = gapHotspots.map(h => ({
        ...h,
        _score: (h.minerals || []).filter(m => !collectedMinerals.has(m.toLowerCase())).length,
      })).sort((a, b) => b._score - a._score);

      const planned = planRoute(origin, scored.slice(0, 12), 6);
      setRoute(planned);
      onRouteChange && onRouteChange(planned);
      setPlanning(false);
    }, 800);
  }

  function handleClear() {
    setRoute([]);
    onRouteChange && onRouteChange([]);
  }

  const totalKm = useMemo(() => {
    if (!route.length) return 0;
    const origin = userLocation || route[0];
    let km = userLocation ? haversineKm(userLocation, route[0]) : 0;
    for (let i = 1; i < route.length; i++) km += haversineKm(route[i - 1], route[i]);
    return Math.round(km);
  }, [route, userLocation]);

  return (
    <div>
      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-wider border transition-all"
        style={{
          background: route.length > 0
            ? 'hsla(45,80%,18%,0.8)'
            : 'hsla(240,30%,8%,0.82)',
          border: route.length > 0
            ? '1px solid hsla(45,80%,50%,0.5)'
            : '1px solid hsla(270,30%,40%,0.25)',
          color: route.length > 0 ? '#f59e0b' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          boxShadow: route.length > 0 ? '0 0 14px hsla(45,80%,50%,0.25)' : 'none',
        }}
      >
        <Route size={13} />
        {route.length > 0 ? `Route (${route.length} stops · ${totalKm}km)` : 'Plan Expedition'}
      </motion.button>

      {/* Planner panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="absolute left-4 right-4 z-[2100] mt-2 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, hsla(245,32%,10%,0.99), hsla(240,26%,6%,0.99))',
              border: '1px solid hsla(270,30%,40%,0.3)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 12px 48px hsla(265,80%,15%,0.5)',
              top: '100%',
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-white font-bold text-sm">Expedition Planner</span>
                </div>
                <button onClick={() => setOpen(false)}>
                  <X size={15} className="text-white/40" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl px-3 py-2 text-center"
                  style={{ background: 'hsla(280,60%,16%,0.7)', border: '1px solid hsla(280,60%,40%,0.2)' }}>
                  <div className="text-lg font-black text-amethyst-glow">{gapHotspots.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-white/35">Gap Sites</div>
                </div>
                <div className="rounded-xl px-3 py-2 text-center"
                  style={{ background: 'hsla(200,60%,14%,0.7)', border: '1px solid hsla(200,60%,40%,0.2)' }}>
                  <div className="text-lg font-black text-hud-cyan">{gapMineralCounts.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-white/35">Missing Types</div>
                </div>
              </div>

              {/* Top missing minerals */}
              {gapMineralCounts.length > 0 && (
                <div className="mb-3">
                  <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-1.5">Top Missing Minerals</div>
                  <div className="flex flex-wrap gap-1">
                    {gapMineralCounts.slice(0, 6).map(([m, n]) => (
                      <span key={m}
                        className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: 'hsla(265,40%,18%,0.8)', border: '1px solid hsla(265,60%,50%,0.25)', color: '#c084fc' }}>
                        {m} <span className="opacity-50">×{n}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Planned route list */}
              {route.length > 0 && (
                <div className="mb-3">
                  <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-1.5">
                    Suggested Route · {totalKm}km
                  </div>
                  <div className="space-y-1">
                    {route.map((h, i) => (
                      <button
                        key={h.id}
                        onClick={() => { onHotspotFocus && onHotspotFocus(h); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-98"
                        style={{ background: 'hsla(255,25%,14%,0.7)', border: '1px solid hsla(255,30%,30%,0.2)' }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black"
                          style={{ background: 'hsla(45,80%,40%,0.3)', color: '#f59e0b', border: '1px solid hsla(45,80%,50%,0.3)' }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs font-semibold truncate">{h.name}</div>
                          <div className="text-white/35 text-[9px]">
                            {(h.minerals || []).filter(m => !collectedMinerals.has(m.toLowerCase())).slice(0, 2).join(', ')}
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-white/30 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePlan}
                  disabled={planning || gapHotspots.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, hsla(265,70%,45%,0.9), hsla(280,80%,55%,0.9))',
                    border: '1px solid hsla(280,80%,65%,0.4)',
                    color: '#fff',
                  }}
                >
                  {planning
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Zap size={13} /> {route.length > 0 ? 'Replan' : 'Plan Route'}</>
                  }
                </button>
                {route.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-3 rounded-xl text-xs font-bold text-white/50 transition-all active:scale-95"
                    style={{ background: 'hsla(0,40%,16%,0.5)', border: '1px solid hsla(0,40%,40%,0.2)' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {gapHotspots.length === 0 && (
                <p className="text-center text-white/30 text-xs mt-2">
                  No collection gaps found — you've covered everything! 🎉
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}