import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// Note: SlidersHorizontal removed — layer controls moved into map component
import { Mountain, Loader2, Locate, ChevronUp, ChevronDown, SlidersHorizontal, Zap, Search, X, MapPin, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import HotspotMap from '@/components/explore/HotspotMap.jsx';
import HotspotListItem from '@/components/explore/HotspotListItem.jsx';
import PredictiveFindsPanel from '@/components/explore/PredictiveFindsPanel.jsx';
import OfflineBanner from '@/components/explore/OfflineBanner.jsx';
import useOfflineHotspots from '@/lib/useOfflineHotspots';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  moderate: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  hard: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  expert: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
};

const LAND_COLORS = {
  public: 'text-emerald-300 border-emerald-400/30',
  blm: 'text-amber-300 border-amber-400/30',
  forest_service: 'text-lime-300 border-lime-400/30',
  state_park: 'text-sky-300 border-sky-400/30',
  private: 'text-rose-300 border-rose-400/30',
  unknown: 'text-white/40 border-white/20',
};

// Compact hotspot card for bottom sheet
function HotspotCard({ hotspot, active, onClick }) {
  const landCls = LAND_COLORS[hotspot.land_type] || LAND_COLORS.unknown;
  const diffCls = DIFFICULTY_COLORS[hotspot.difficulty] || '';
  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-56 rounded-2xl cursor-pointer transition-all overflow-hidden',
        'border backdrop-blur-xl',
        active
          ? 'border-hud-cyan/60 shadow-[0_0_20px_hsla(195,100%,60%,0.25)]'
          : 'border-white/8 hover:border-white/20',
      )}
      style={{
        background: active
          ? 'linear-gradient(145deg, hsla(215,60%,14%,0.95), hsla(220,50%,8%,0.98))'
          : 'linear-gradient(145deg, hsla(255,30%,12%,0.85), hsla(240,25%,7%,0.9))',
      }}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold text-[13px] leading-tight truncate">{hotspot.name}</div>
            <div className={cn('text-[10px] mt-0.5 font-mono tracking-widest border rounded-full px-1.5 py-0 inline-block', landCls)}>
              {(hotspot.land_type || 'unknown').replace('_', ' ').toUpperCase()}
            </div>
          </div>
          {hotspot.difficulty && (
            <div className={cn('text-[9px] font-bold uppercase tracking-wider border rounded-md px-1.5 py-0.5 shrink-0', diffCls)}>
              {hotspot.difficulty}
            </div>
          )}
        </div>

        {hotspot.minerals?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {hotspot.minerals.slice(0, 3).map(m => (
              <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amethyst/12 text-amethyst-glow border border-amethyst/20">
                {m}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/6">
          <span className="text-[10px] text-white/35">{hotspot.state || hotspot.country || '—'}</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{
              background: `hsl(${Math.round((hotspot.trust_score || 0.5) * 120)}, 80%, 55%)`,
              boxShadow: `0 0 6px hsl(${Math.round((hotspot.trust_score || 0.5) * 120)}, 80%, 55%, 0.6)`,
            }} />
            <span className="text-[10px] font-mono text-white/45">{((hotspot.trust_score || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Log a Find button — always visible on every card */}
        <Link
          to="/scan"
          onClick={e => e.stopPropagation()}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsla(265,70%,45%,0.85), hsla(280,80%,55%,0.85))',
            border: '1px solid hsla(280,80%,65%,0.4)',
            color: '#fff',
          }}
          aria-label={`Log a Find at ${hotspot.name}`}
        >
          <MapPin size={11} />
          Log a Find
        </Link>
      </div>
    </motion.div>
  );
}

// Stats pill
function StatPill({ value, label, color = 'amethyst' }) {
  const colors = {
    amethyst: 'text-amethyst-glow border-amethyst/25 bg-amethyst/10',
    cyan: 'text-hud-cyan border-hud-cyan/25 bg-hud-cyan/10',
    green: 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10',
  };
  return (
    <div className={cn('flex flex-col items-center px-3 py-1.5 rounded-xl border', colors[color])}>
      <span className="text-lg font-black leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-[0.2em] opacity-70 mt-0.5">{label}</span>
    </div>
  );
}

export default function Explore() {
  const {
    data: hotspots = [],
    isLoading: loading,
    isOffline,
    cachedAt,
    refetch,
  } = useOfflineHotspots();

  const { data: specimens = [] } = useQuery({
    queryKey: ['specimens-geo'],
    queryFn: () => base44.entities.Specimen.list(),
    initialData: [],
  });

  const [activeId, setActiveId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [mineralFilter, setMineralFilter] = useState('');
  const scrollRef = useRef(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);

  // Collect unique minerals across all hotspots for the filter dropdown
  const allMinerals = useMemo(() => {
    const set = new Set();
    hotspots.forEach(h => h.minerals?.forEach(m => set.add(m)));
    return [...set].sort();
  }, [hotspots]);

  const filteredHotspots = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return hotspots.filter(h => {
      if (q && !(
        h.name?.toLowerCase().includes(q) ||
        h.state?.toLowerCase().includes(q) ||
        h.minerals?.some(m => m.toLowerCase().includes(q))
      )) return false;
      if (difficultyFilter && h.difficulty !== difficultyFilter) return false;
      if (mineralFilter && !h.minerals?.includes(mineralFilter)) return false;
      return true;
    });
  }, [hotspots, searchQuery, difficultyFilter, mineralFilter]);

  const activeHotspot = hotspots.find(h => h.id === activeId);

  // Scroll active card into view
  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-id="${activeId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeId]);

  const publicCount = hotspots.filter(h => ['public', 'blm', 'forest_service', 'state_park'].includes(h.land_type)).length;

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
            hotspots={hotspots}
            specimens={specimens}
            height="100%"
            activeId={activeId}
            onMarkerClick={h => { setActiveId(h.id); setSheetOpen(true); }}
            userLocation={userLocation}
          />
        )}
      </div>

      {/* ── TOP HUD BAR ── */}
      <div className="absolute top-0 inset-x-0 z-[1000] px-4 pt-4 pointer-events-none">
        <div className="flex items-start gap-3">

          {/* Search */}
          <div className="flex-1 pointer-events-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
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
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Locate button */}
          <button
            onClick={locate}
            disabled={locating}
            className="pointer-events-auto w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
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

        {/* Filter row — always visible */}
        <div
          className="mt-2 flex gap-2 pointer-events-auto flex-wrap items-center"
          onTouchStart={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] text-white/50"
            style={{ background: 'hsla(240,30%,8%,0.7)', border: '1px solid hsla(270,30%,40%,0.2)', backdropFilter: 'blur(20px)' }}>
            <Filter size={10} />
            <span className="uppercase tracking-wider">Filter</span>
          </div>

          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            aria-label="Filter by difficulty"
            className="px-3 py-2 rounded-xl text-xs text-white/80 outline-none"
            style={{
              background: 'hsla(240,30%,8%,0.88)',
              border: `1px solid ${difficultyFilter ? 'hsla(35,90%,60%,0.6)' : 'hsla(270,30%,40%,0.3)'}`,
              backdropFilter: 'blur(20px)',
              color: difficultyFilter ? 'hsl(35,90%,65%)' : 'rgba(255,255,255,0.8)',
            }}
          >
            <option value="">Difficulty</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>

          <select
            value={mineralFilter}
            onChange={e => setMineralFilter(e.target.value)}
            aria-label="Filter by mineral"
            className="px-3 py-2 rounded-xl text-xs text-white/80 outline-none max-w-[140px]"
            style={{
              background: 'hsla(240,30%,8%,0.88)',
              border: `1px solid ${mineralFilter ? 'hsla(265,80%,65%,0.6)' : 'hsla(270,30%,40%,0.3)'}`,
              backdropFilter: 'blur(20px)',
              color: mineralFilter ? 'hsl(265,80%,80%)' : 'rgba(255,255,255,0.8)',
            }}
          >
            <option value="">Mineral</option>
            {allMinerals.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {(difficultyFilter || mineralFilter) && (
            <button
              onClick={() => { setDifficultyFilter(''); setMineralFilter(''); }}
              className="px-2.5 py-1.5 rounded-xl text-[10px] text-rose-400/80 transition-all"
              style={{ background: 'hsla(0,60%,20%,0.5)', border: '1px solid hsla(0,60%,40%,0.3)', backdropFilter: 'blur(20px)' }}
              aria-label="Clear filters"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Offline banner */}
        {isOffline && hotspots.length > 0 && (
          <div className="mt-2 pointer-events-auto">
            <OfflineBanner cachedAt={cachedAt} count={hotspots.length} />
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET ── */}
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
                maxHeight: '75vh',
              }}
            >
              {/* Handle & header */}
              <div className="flex flex-col items-center px-4 pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/15 mb-4" />

                <div className="w-full flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-white font-bold text-base">
                      {searchQuery ? `${filteredHotspots.length} results` : 'Nearby Sites'}
                    </h2>
                    <p className="text-white/35 text-[11px] uppercase tracking-[0.2em]">
                      {hotspots.length} total · {publicCount} open to collect
                    </p>
                  </div>
                  <button onClick={() => setSheetOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'hsla(255,30%,20%,0.5)', border: '1px solid hsla(255,30%,40%,0.2)' }}>
                    <ChevronDown size={16} className="text-white/60" />
                  </button>
                </div>

                {/* Stats strip */}
                <div className="flex gap-2 w-full justify-center mb-3">
                  <StatPill value={hotspots.length} label="Sites" color="amethyst" />
                  <StatPill value={publicCount} label="Open" color="green" />
                  <StatPill value={specimens.filter(s => s.lat && s.lng).length} label="My Finds" color="cyan" />
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>

              {/* Horizontal scroll list */}
              <div ref={scrollRef} className="flex gap-3 px-4 pb-4 overflow-x-auto" style={{ scrollSnapType: 'x mandatory' }}>
                {filteredHotspots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center w-full py-8 text-white/30">
                    <Mountain size={28} className="mb-2" />
                    <p className="text-sm">No hotspots found</p>
                  </div>
                ) : (
                  filteredHotspots.map(h => (
                    <div key={h.id} data-id={h.id} style={{ scrollSnapAlign: 'start' }}>
                      <HotspotCard
                        hotspot={h}
                        active={activeId === h.id}
                        onClick={() => setActiveId(prev => prev === h.id ? prev : h.id)}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Active hotspot detail */}
              <AnimatePresence>
                {activeHotspot && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mx-4 mb-3"
                  >
                    <div className="rounded-2xl p-4"
                      style={{ background: 'hsla(215,50%,12%,0.8)', border: '1px solid hsla(195,100%,60%,0.2)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-bold text-sm">{activeHotspot.name}</h3>
                          <p className="text-white/40 text-[11px] mt-0.5">{activeHotspot.description?.slice(0, 80) || 'No description'}</p>
                        </div>
                        <button onClick={() => setActiveId(null)} className="text-white/30 hover:text-white/60">
                          <X size={14} />
                        </button>
                      </div>
                      {activeHotspot.rules && (
                        <div className="mt-2 px-3 py-2 rounded-xl text-[11px] text-amber-300/80"
                          style={{ background: 'hsla(45,80%,30%,0.15)', border: '1px solid hsla(45,80%,50%,0.2)' }}>
                          📋 {activeHotspot.rules}
                        </div>
                      )}
                      <Link
                        to="/scan"
                        className="mt-3 w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, hsla(265,70%,50%,0.9), hsla(280,80%,60%,0.9))',
                          border: '1px solid hsla(280,80%,70%,0.5)',
                          boxShadow: '0 0 20px hsla(265,80%,55%,0.3)',
                          color: '#fff',
                        }}
                      >
                        <MapPin size={15} />
                        Log a Specimen Find
                      </Link>
                    </div>
                    <PredictiveFindsPanel userLocation={userLocation} hotspots={[activeHotspot]} />
                  </motion.div>
                )}
              </AnimatePresence>

              </div>{/* end scrollable body */}
            </motion.div>
          ) : (
            /* Collapsed pill — tap to open */
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
                display: 'flex',
              }}
            >
              <Zap size={14} className="text-amethyst-glow" />
              <span className="text-white/80 text-sm font-semibold">
                {hotspots.length} hotspots nearby
              </span>
              <ChevronUp size={14} className="text-white/40" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}