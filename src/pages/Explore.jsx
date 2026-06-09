/**
 * Explore — Interactive RockHound-GO map page.
 * Fully rebuilt with:
 *  - Layer toggles (All, Rare, Gaps, Public, Expedition)
 *  - Expedition route planner
 *  - Tap-to-reveal hotspot detail sheet
 *  - Badge glow effects
 *  - Mobile-first bottom sheet UX
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Loader2, Locate, Zap, Search, X, ChevronUp } from 'lucide-react';
import HotspotMap from '@/components/explore/HotspotMap.jsx';
import MapLayerPanel from '@/components/explore/MapLayerPanel.jsx';
import HotspotDetailSheet from '@/components/explore/HotspotDetailSheet.jsx';
import ExpeditionPlanner from '@/components/explore/ExpeditionPlanner.jsx';
import OfflineBanner from '@/components/explore/OfflineBanner.jsx';
import useOfflineHotspots from '@/lib/useOfflineHotspots';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Mini stat pill ────────────────────────────────────────────────────────────
function StatPill({ value, label, color = '#94a3b8' }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
      style={{ borderColor: `${color}30`, background: `${color}10` }}>
      <span className="text-lg font-black leading-none" style={{ color }}>{value}</span>
      <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 mt-0.5"
        style={{ color }}>{label}</span>
    </div>
  );
}

// ── Compact hotspot list card ─────────────────────────────────────────────────
const LAND_COLORS = {
  public: '#34d399', blm: '#fbbf24', forest_service: '#a3e635',
  state_park: '#38bdf8', private: '#fb7185', unknown: '#94a3b8',
};

function HotspotCard({ hotspot, active, onClick }) {
  const color = LAND_COLORS[hotspot.land_type] || LAND_COLORS.unknown;
  return (
    <motion.div
      layout
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex-shrink-0 w-52 rounded-2xl cursor-pointer overflow-hidden border transition-all"
      style={{
        background: active
          ? 'linear-gradient(145deg, hsla(215,60%,14%,0.96), hsla(220,50%,8%,0.99))'
          : 'linear-gradient(145deg, hsla(255,30%,12%,0.85), hsla(240,25%,7%,0.9))',
        borderColor: active ? 'hsla(195,100%,60%,0.55)' : 'hsla(255,30%,40%,0.15)',
        boxShadow: active ? '0 0 20px hsla(195,100%,60%,0.2)' : 'none',
      }}
    >
      <div className="p-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold text-[12px] leading-tight truncate">{hotspot.name}</div>
            <div className="text-[9px] mt-0.5 font-mono tracking-widest uppercase"
              style={{ color }}>
              {(hotspot.land_type || 'unknown').replace(/_/g, ' ')}
            </div>
          </div>
          {hotspot.difficulty && (
            <div className="text-[8px] font-bold uppercase tracking-wider border rounded px-1 py-0.5 shrink-0"
              style={{
                color: { easy: '#34d399', moderate: '#fbbf24', hard: '#f97316', expert: '#fb7185' }[hotspot.difficulty] || '#94a3b8',
                borderColor: 'hsla(255,30%,40%,0.2)',
                background: 'hsla(255,30%,12%,0.6)',
              }}>
              {hotspot.difficulty}
            </div>
          )}
        </div>

        {/* Minerals */}
        {hotspot.minerals?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {hotspot.minerals.slice(0, 3).map(m => (
              <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'hsla(265,40%,20%,0.6)', color: '#c084fc', border: '1px solid hsla(265,60%,50%,0.2)' }}>
                {m}
              </span>
            ))}
          </div>
        )}

        {/* Trust score */}
        <div className="flex items-center justify-between pt-1.5 border-t"
          style={{ borderColor: 'hsla(255,30%,30%,0.15)' }}>
          <span className="text-[9px] text-white/25">{hotspot.state || '—'}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: `hsl(${Math.round((hotspot.trust_score || 0.5) * 120)},80%,55%)` }} />
            <span className="text-[9px] font-mono text-white/35">
              {((hotspot.trust_score || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Explore page ─────────────────────────────────────────────────────────
export default function Explore() {
  const { data: hotspots = [], isLoading: loading, isOffline, cachedAt } = useOfflineHotspots();
  const { data: specimens = [] } = useQuery({
    queryKey: ['specimens-geo'],
    queryFn: () => base44.entities.Specimen.list(),
    initialData: [],
  });

  const { earnedCodes } = useBadgeAwarder();

  const [activeId,       setActiveId]       = useState(null);
  const [userLocation,   setUserLocation]   = useState(null);
  const [locating,       setLocating]       = useState(false);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [detailHotspot,  setDetailHotspot]  = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeLayer,    setActiveLayer]    = useState('all');
  const [expeditionRoute, setExpeditionRoute] = useState([]);
  const scrollRef = useRef(null);

  // ── Geolocation ──────────────────────────────────────────────────────────
  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      ()  => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);
  useEffect(() => { locate(); }, [locate]);

  // ── Collection gap computation ───────────────────────────────────────────
  const collectedMinerals = useMemo(
    () => new Set(specimens.map(s => (s.mineral_name || '').toLowerCase().trim()).filter(Boolean)),
    [specimens]
  );

  const collectionGapIds = useMemo(() => {
    const ids = new Set();
    hotspots.forEach(h => {
      if ((h.minerals || []).some(m => !collectedMinerals.has(m.toLowerCase()))) ids.add(h.id);
    });
    return ids;
  }, [hotspots, collectedMinerals]);

  // ── Search filter ────────────────────────────────────────────────────────
  const filteredHotspots = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return hotspots.filter(h =>
      !q ||
      h.name?.toLowerCase().includes(q) ||
      h.state?.toLowerCase().includes(q) ||
      h.minerals?.some(m => m.toLowerCase().includes(q))
    );
  }, [hotspots, searchQuery]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleMarkerClick = useCallback(h => {
    setActiveId(h.id);
    setDetailHotspot(h);
  }, []);

  const handleCardClick = useCallback(h => {
    setActiveId(h.id);
    setDetailHotspot(h);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailHotspot(null);
    setActiveId(null);
  }, []);

  // Scroll active card into view
  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-id="${activeId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeId]);

  const publicCount = hotspots.filter(h =>
    ['public','blm','forest_service','state_park'].includes(h.land_type)
  ).length;

  // Collection gaps for active hotspot detail
  const activeGapMinerals = useMemo(() => {
    if (!detailHotspot) return [];
    return (detailHotspot.minerals || []).filter(m => !collectedMinerals.has(m.toLowerCase()));
  }, [detailHotspot, collectedMinerals]);

  // Layer for expedition mode shows route waypoints
  const mapLayer = expeditionRoute.length > 0 && activeLayer === 'expedition'
    ? 'expedition' : activeLayer;

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 0px)' }}>

      {/* ── FULLSCREEN MAP ── */}
      <div className="absolute inset-0">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'radial-gradient(ellipse at center, hsla(220,40%,8%,1) 0%, hsla(240,30%,4%,1) 100%)' }}>
            <div className="w-12 h-12 rounded-full border-2 border-amethyst/20 border-t-amethyst-glow animate-spin" />
            <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em]">Scanning region…</p>
          </div>
        ) : (
          <HotspotMap
            hotspots={filteredHotspots}
            specimens={specimens}
            height="100%"
            activeId={activeId}
            onMarkerClick={handleMarkerClick}
            userLocation={userLocation}
            activeLayer={mapLayer}
            collectionGapIds={collectionGapIds}
            expeditionRoute={expeditionRoute}
            earnedBadgeCodes={earnedCodes}
          />
        )}
      </div>

      {/* ── TOP HUD ── */}
      <div className="absolute top-0 inset-x-0 z-[1000] px-4 pt-4 pointer-events-none">

        {/* Row 1: search + locate */}
        <div className="flex items-center gap-2 pointer-events-auto mb-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
            <input
              type="text"
              placeholder="Search hotspots, minerals…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 rounded-2xl text-sm text-white/90 placeholder-white/30 outline-none"
              style={{
                background: 'hsla(240,30%,8%,0.88)',
                border: '1px solid hsla(270,30%,40%,0.3)',
                backdropFilter: 'blur(20px)',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                <X size={13} />
              </button>
            )}
          </div>
          <button
            onClick={locate}
            disabled={locating}
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{
              background: userLocation ? 'hsla(195,100%,40%,0.25)' : 'hsla(240,30%,8%,0.88)',
              border: userLocation ? '1px solid hsla(195,100%,60%,0.5)' : '1px solid hsla(255,30%,40%,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: userLocation ? '0 0 16px hsla(195,100%,60%,0.25)' : 'none',
            }}
            aria-label="My location"
          >
            {locating
              ? <Loader2 size={16} className="text-hud-cyan animate-spin" />
              : <Locate size={16} className={userLocation ? 'text-hud-cyan' : 'text-white/50'} />
            }
          </button>
        </div>

        {/* Row 2: Layer toggles */}
        <div className="pointer-events-auto mb-2">
          <MapLayerPanel activeLayer={activeLayer} onLayerChange={setActiveLayer} />
        </div>

        {/* Row 3: Expedition planner (relative parent for dropdown) */}
        <div className="pointer-events-auto relative">
          <ExpeditionPlanner
            hotspots={hotspots}
            specimens={specimens}
            userLocation={userLocation}
            onRouteChange={route => {
              setExpeditionRoute(route);
              if (route.length > 0) setActiveLayer('expedition');
            }}
            onHotspotFocus={h => {
              setActiveId(h.id);
              setDetailHotspot(h);
            }}
          />
        </div>

        {/* Offline banner */}
        {isOffline && hotspots.length > 0 && (
          <div className="mt-2 pointer-events-auto">
            <OfflineBanner cachedAt={cachedAt} count={hotspots.length} />
          </div>
        )}
      </div>

      {/* ── HOTSPOT DETAIL SHEET (tap on pin) ── */}
      {detailHotspot && (
        <HotspotDetailSheet
          hotspot={detailHotspot}
          specimens={specimens}
          earnedCodes={earnedCodes}
          collectionGapMinerals={activeGapMinerals}
          onClose={handleCloseDetail}
        />
      )}

      {/* ── BOTTOM LIST SHEET ── */}
      {!detailHotspot && (
        <div className="absolute bottom-0 inset-x-0 z-[1000] pointer-events-none">
          <AnimatePresence mode="wait">
            {sheetOpen ? (
              <motion.div
                key="open"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="pointer-events-auto rounded-t-3xl flex flex-col"
                style={{
                  background: 'linear-gradient(180deg, hsla(245,30%,9%,0.97) 0%, hsla(240,25%,6%,0.99) 100%)',
                  backdropFilter: 'blur(32px)',
                  border: '1px solid hsla(270,30%,40%,0.2)',
                  borderBottom: 'none',
                  maxHeight: '60vh',
                }}
              >
                {/* Handle + header */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-1 rounded-full bg-white/15" />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-white font-bold text-sm">
                        {searchQuery ? `${filteredHotspots.length} results` : 'Nearby Hotspots'}
                      </h2>
                      <p className="text-white/30 text-[10px] uppercase tracking-[0.2em]">
                        {hotspots.length} total · {publicCount} open
                      </p>
                    </div>
                    <button
                      onClick={() => setSheetOpen(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'hsla(255,30%,20%,0.5)', border: '1px solid hsla(255,30%,40%,0.2)' }}
                    >
                      <X size={14} className="text-white/50" />
                    </button>
                  </div>
                  {/* Stats */}
                  <div className="flex gap-2 mb-3">
                    <StatPill value={hotspots.length}                        label="Sites"    color="#c084fc" />
                    <StatPill value={publicCount}                             label="Open"     color="#34d399" />
                    <StatPill value={collectionGapIds.size}                   label="Gaps"     color="#a78bfa" />
                    <StatPill value={specimens.filter(s=>s.lat&&s.lng).length} label="My Finds" color="#22d3ee" />
                  </div>
                </div>

                {/* Scrollable card list */}
                <div className="overflow-y-auto flex-1"
                  style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))' }}>
                  <div
                    ref={scrollRef}
                    className="flex gap-3 px-4 pb-4 overflow-x-auto"
                    style={{ scrollSnapType: 'x mandatory' }}
                  >
                    {filteredHotspots.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-8 text-white/30">
                        <p className="text-sm">No hotspots found</p>
                      </div>
                    ) : (
                      filteredHotspots.map(h => (
                        <div key={h.id} data-id={h.id} style={{ scrollSnapAlign: 'start' }}>
                          <HotspotCard
                            hotspot={h}
                            active={activeId === h.id}
                            onClick={() => handleCardClick(h)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Collapsed pill */
              <motion.button
                key="closed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={() => setSheetOpen(true)}
                className="pointer-events-auto mx-auto mb-28 flex items-center gap-2.5 px-5 py-3 rounded-full"
                style={{
                  background: 'hsla(245,30%,9%,0.92)',
                  border: '1px solid hsla(270,40%,40%,0.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px hsla(265,80%,20%,0.4)',
                }}
              >
                {loading
                  ? <Loader2 size={14} className="text-amethyst-glow animate-spin" />
                  : <Zap size={14} className="text-amethyst-glow" />
                }
                <span className="text-white/80 text-sm font-semibold">
                  {loading ? 'Loading hotspots…' : `${filteredHotspots.length} hotspots`}
                </span>
                <ChevronUp size={14} className="text-white/40" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}