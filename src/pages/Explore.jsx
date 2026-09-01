/**
 * Explore — RockHound-GO interactive map (complete rebuild)
 *
 * Features:
 * - Real-time "You Are Here" pulsing marker
 * - Hotspot pins colored by mineral rarity (purple=rare, gold=legendary)
 * - Layer toggles: Public Finds | My Collection | Rare Only | Gaps | Route
 * - Tap any hotspot → full detail sheet (rock types, difficulty, badge rewards, photos)
 * - Collection gap heatmap (dashed ring on gap hotspots)
 * - Expedition route planner
 * - Badge glow effects on map when Crystal Whisperer / rare badges earned
 */
import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { Loader2, Locate, Zap, Search, X, ChevronUp, Layers, Mountain, CloudRain, Sun, Flame } from 'lucide-react';
import QuickPinButton from '@/components/explore/QuickPinButton.jsx';
import GeologyInfoCard from '@/components/explore/GeologyInfoCard.jsx';
import WeatherPanel from '@/components/explore/WeatherPanel.jsx';
import HotspotMap from '@/components/explore/GoogleHotspotMap.jsx';
import HotspotDetailSheet from '@/components/explore/HotspotDetailSheet.jsx';
import ExpeditionPlanner from '@/components/explore/ExpeditionPlanner.jsx';
import OfflineBanner from '@/components/explore/OfflineBanner.jsx';
import useOfflineHotspots from '@/lib/useOfflineHotspots';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import BadgeUnlockAnimation from '@/components/badges/BadgeUnlockAnimation.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import useSpawns from '@/lib/useSpawns';
import SpawnMapLayer from '@/components/ar/SpawnMapLayer.jsx';
import SpawnHUD from '@/components/ar/SpawnHUD.jsx';
import AREncounterScreen from '@/components/ar/AREncounterScreen.jsx';

// ── Rarity-aware color for hotspot list cards ─────────────────────────────────
const LAND_COLORS = {
  public: '#34d399', blm: '#fbbf24', forest_service: '#a3e635',
  state_park: '#38bdf8', private: '#fb7185', unknown: '#94a3b8',
};

function StatPill({ value, label, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-xl border"
      style={{ borderColor: `${color}30`, background: `${color}10` }}>
      <span className="text-lg font-black leading-none" style={{ color }}>{value}</span>
      <span className="text-[9px] uppercase tracking-[.2em] opacity-60 mt-0.5" style={{ color }}>{label}</span>
    </div>
  );
}

// Compact hotspot card in the bottom sheet list (Memoized to prevent unnecessary re-renders)
const HotspotCard = memo(function HotspotCard({ hotspot, active, hasGap, onClick }) {
  const color = hasGap ? '#c084fc' : LAND_COLORS[hotspot.land_type] || LAND_COLORS.unknown;
  // Determine rarity-themed border for special hotspots
  const hasLegendary = (hotspot.minerals||[]).some(m =>
    ['sapphire','emerald','ruby','diamond','tanzanite'].includes(m.toLowerCase()));
  const hasRare = (hotspot.minerals||[]).some(m =>
    ['tourmaline','topaz','alexandrite','aquamarine'].includes(m.toLowerCase()));

  const borderColor = active ? 'hsla(195,100%,60%,.55)'
    : hasLegendary ? 'hsla(45,100%,60%,.45)'
    : hasRare ? 'hsla(265,90%,70%,.4)'
    : 'hsla(255,30%,40%,.15)';

  return (
    <motion.div
      layout whileTap={{ scale: .97 }} onClick={onClick}
      className="flex-shrink-0 w-52 rounded-2xl cursor-pointer overflow-hidden border transition-all"
      style={{
        background: active
          ? 'linear-gradient(145deg,hsla(215,60%,14%,.96),hsla(220,50%,8%,.99))'
          : 'linear-gradient(145deg,hsla(255,30%,12%,.85),hsla(240,25%,7%,.9))',
        borderColor,
        boxShadow: active ? `0 0 20px hsla(195,100%,60%,.2)` : hasLegendary ? `0 0 14px hsla(45,100%,60%,.15)` : 'none',
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold text-[12px] leading-tight truncate">{hotspot.name}</div>
            <div className="text-[9px] mt-0.5 font-mono tracking-widest uppercase" style={{ color }}>
              {(hotspot.land_type||'unknown').replace(/_/g,' ')}
            </div>
          </div>
          {hotspot.difficulty && (
            <div className="text-[8px] font-bold uppercase tracking-wider border rounded px-1 py-0.5 shrink-0"
              style={{
                color: {easy:'#34d399',moderate:'#fbbf24',hard:'#f97316',expert:'#fb7185'}[hotspot.difficulty]||'#94a3b8',
                borderColor: 'hsla(255,30%,40%,.2)', background: 'hsla(255,30%,12%,.6)',
              }}>
              {hotspot.difficulty}
            </div>
          )}
        </div>
        {hotspot.minerals?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {hotspot.minerals.slice(0,3).map(m => (
              <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'hsla(265,40%,20%,.6)', color: '#c084fc', border: '1px solid hsla(265,60%,50%,.2)' }}>
                {m}
              </span>
            ))}
          </div>
        )}
        {/* Gap indicator */}
        {hasGap && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-1 h-1 rounded-full bg-amethyst-glow animate-pulse" />
            <span className="text-[8px] text-amethyst-glow/80 uppercase tracking-wider font-bold">Collection Gap</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderColor: 'hsla(255,30%,30%,.15)' }}>
          <span className="text-[9px] text-white/50">{hotspot.state||'—'}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: `hsl(${Math.round((hotspot.trust_score||.5)*120)},80%,55%)` }} />
            <span className="text-[9px] font-mono text-white/35">{((hotspot.trust_score||0)*100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Explore() {
  const { data: hotspots = [], isLoading: loading, isOffline, cachedAt } = useOfflineHotspots();
  const { data: specimens = [] } = useQuery({
    queryKey: ['specimens-explore'],
    queryFn: () => base44.entities.Specimen.list('-found_date', 500),
    initialData: [],
  });
  // Club chapters — shown as pins on the map for club discovery
  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs-explore'],
    queryFn: () => base44.entities.ClubChapter.list('-created_date', 100),
    initialData: [],
  });
  const { earnedCodes, pendingBadge, dismissPending } = useBadgeAwarder();

  const [activeId,       setActiveId]       = useState(null);
  const [userLocation,   setUserLocation]   = useState(null);
  const [locating,       setLocating]       = useState(false);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [detailHotspot,  setDetailHotspot]  = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeLayer,    setActiveLayer]    = useState('all');
  const [selectedMinerals, setSelectedMinerals] = useState(new Set());
  const [expeditionRoute, setExpeditionRoute] = useState([]);
  const [showGeology,    setShowGeology]    = useState(false);
  const [hudMode,        setHudMode]        = useState(false);
  const [showWeather,    setShowWeather]    = useState(false);
  const [arActive,       setArActive]       = useState(false);
  const [activeSpawn,    setActiveSpawn]    = useState(null);
  const [showHeatMap,    setShowHeatMap]    = useState(false);
  const scrollRef = useRef(null);

  const { spawns, caughtToday, dailyCap, catchSpawn, dismissSpawn } = useSpawns({
    userLocation, hotspots,
  });

  // Geolocation
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

  // Deep-link from Hub "Weekend Family Adventure" — start on public land layer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === 'family') setActiveLayer('public');
  }, []);

  // Collected minerals set
  const collectedMinerals = useMemo(
    () => new Set(specimens.map(s => (s.mineral_name||'').toLowerCase().trim()).filter(Boolean)),
    [specimens]
  );

  // Collection gap hotspot IDs
  const collectionGapIds = useMemo(() => {
    const ids = new Set();
    hotspots.forEach(h => {
      if ((h.minerals||[]).some(m => !collectedMinerals.has(m.toLowerCase()))) ids.add(h.id);
    });
    return ids;
  }, [hotspots, collectedMinerals]);

  // Active gap minerals for detail sheet
  const activeGapMinerals = useMemo(() => {
    if (!detailHotspot) return [];
    return (detailHotspot.minerals||[]).filter(m => !collectedMinerals.has(m.toLowerCase()));
  }, [detailHotspot, collectedMinerals]);

  // Sorted lowercase lookup for filtering
  const selectedMineralsLower = useMemo(
    () => new Set([...selectedMinerals].map(m => m.toLowerCase())),
    [selectedMinerals]
  );

  // Search filter
  const filteredHotspots = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = hotspots;
    if (q) list = list.filter(h =>
      h.name?.toLowerCase().includes(q) ||
      h.state?.toLowerCase().includes(q) ||
      h.minerals?.some(m => m.toLowerCase().includes(q))
    );
    // Layer-specific filtering for card list
    if (activeLayer === 'rare')   list = list.filter(h => (h.minerals||[]).some(m => ['tourmaline','topaz','sapphire','emerald','ruby','alexandrite'].includes(m.toLowerCase())));
    if (activeLayer === 'gaps')   list = list.filter(h => collectionGapIds.has(h.id));
    if (activeLayer === 'public') list = list.filter(h => ['public','blm','forest_service','state_park'].includes(h.land_type));
    if (activeLayer === 'land')   list = list.filter(h => h.access_status && h.access_status !== 'unknown' && h.access_status !== 'open');
    if (activeLayer === 'mine')   list = list.filter(h => (h.minerals||[]).some(m => collectedMinerals.has(m.toLowerCase())));
    // Mineral type filter — only hotspots containing at least one selected mineral
    if (selectedMineralsLower.size > 0) {
      list = list.filter(h => (h.minerals || []).some(m => selectedMineralsLower.has(m.toLowerCase())));
    }
    return list;
  }, [hotspots, searchQuery, activeLayer, collectionGapIds, collectedMinerals, selectedMineralsLower]);

  const handleMarkerClick = useCallback(h => { setActiveId(h.id); setDetailHotspot(h); }, []);
  const handleCloseDetail = useCallback(() => { setDetailHotspot(null); setActiveId(null); }, []);

  // Scroll active card into view
  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-id="${activeId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeId]);

  const publicCount = hotspots.filter(h => ['public','blm','forest_service','state_park'].includes(h.land_type)).length;

  return (
    <div className="relative w-full isolate overflow-hidden" style={{ height: '100dvh' }}>
      {/* HUD mode overlay */}
      {hudMode && (
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, hsla(215,80%,6%,.55) 0%, transparent 30%, transparent 70%, hsla(215,80%,6%,.4) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* ── FULLSCREEN MAP ── always mounted so hotspots render as soon as data arrives */}
      <div className="absolute inset-0">
        {arActive && (
          <SpawnMapLayer
            spawns={spawns}
            caughtToday={caughtToday}
            dailyCap={dailyCap}
            onSpawnTap={(spawn) => setActiveSpawn(spawn)}
          />
        )}
        <HotspotMap
          hotspots={filteredHotspots}
          specimens={specimens}
          clubs={clubs}
          height="100%"
          activeId={activeId}
          onMarkerClick={handleMarkerClick}
          userLocation={userLocation}
          activeLayer={activeLayer}
          collectionGapIds={collectionGapIds}
          expeditionRoute={expeditionRoute}
          showGeology={showGeology}
          earnedBadgeCodes={earnedCodes}
          userMinerals={[...collectedMinerals]}
          hudMode={hudMode}
          selectedMineralFilter={selectedMineralsLower}
          showHeatMap={showHeatMap}
        />
        {/* Overlay spinner while first load is in flight (no cached data yet) */}
        {loading && filteredHotspots.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center,hsla(220,40%,8%,0.85) 0%,hsla(240,30%,4%,0.75) 100%)' }}>
            <div className="w-12 h-12 rounded-full border-2 border-amethyst/20 border-t-amethyst-glow animate-spin" />
            <p className="text-amethyst/60 text-xs uppercase tracking-[.3em]">Scanning region…</p>
          </div>
        )}
      </div>

      {/* ── TOP HUD ── */}
      <div className={`absolute top-0 inset-x-0 z-[1000] px-4 pt-4 pointer-events-none transition-all duration-300 ${hudMode ? 'hud-mode-active' : ''}`}>
        {hudMode && (
          <style>{`
            .hud-mode-active input { background: hsla(215,80%,7%,.96) !important; border-color: hsla(195,100%,60%,.6) !important; color: hsl(195,100%,82%) !important; }
            .hud-mode-active input::placeholder { color: hsla(195,100%,60%,.4) !important; }
          `}</style>
        )}
        {/* Search + locate row */}
        <div className="flex items-center gap-2 pointer-events-auto mb-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
            <input type="text" placeholder="Search hotspots, minerals…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 rounded-2xl text-sm text-white/90 placeholder-white/30 outline-none"
              style={{ background: 'hsla(240,30%,8%,.88)', border: '1px solid hsla(270,30%,40%,.3)', backdropFilter: 'blur(20px)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
                aria-label="Clear search"
              >
                <X size={13}/>
              </button>
            )}
          </div>
          <button onClick={locate} disabled={locating}
            aria-label="My location"
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
            style={{
              background: userLocation ? 'hsla(195,100%,40%,.25)' : 'hsla(240,30%,8%,.88)',
              border: userLocation ? '1px solid hsla(195,100%,60%,.5)' : '1px solid hsla(255,30%,40%,.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: userLocation ? '0 0 16px hsla(195,100%,60%,.25)' : 'none',
            }}>
            {locating ? <Loader2 size={16} className="text-hud-cyan animate-spin"/> : <Locate size={16} className={userLocation ? 'text-hud-cyan' : 'text-white/50'}/>}
          </button>
          <button onClick={() => setShowGeology(g => !g)}
            aria-label="Toggle geology view"
            aria-pressed={showGeology}
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            style={{
              background: showGeology ? 'hsla(150,60%,30%,.3)' : 'hsla(240,30%,8%,.88)',
              border: showGeology ? '1px solid hsla(150,70%,50%,.55)' : '1px solid hsla(255,30%,40%,.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: showGeology ? '0 0 16px hsla(150,70%,50%,.25)' : 'none',
            }}>
            <Mountain size={16} className={showGeology ? 'text-emerald-300' : 'text-white/50'} />
          </button>
          <SpawnHUD
            spawns={spawns}
            caughtToday={caughtToday}
            dailyCap={dailyCap}
            arActive={arActive}
            onToggleAR={() => setArActive(a => !a)}
          />
          <QuickPinButton userLocation={userLocation} />

          {/* HUD mode toggle */}
          <button
            onClick={() => setHudMode(h => !h)}
            title="High-contrast HUD mode"
            aria-pressed={hudMode}
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
            style={{
              background: hudMode ? 'hsla(195,100%,30%,.4)' : 'hsla(240,30%,8%,.88)',
              border: hudMode ? '1px solid hsla(195,100%,60%,.7)' : '1px solid hsla(255,30%,40%,.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: hudMode ? '0 0 18px hsla(195,100%,60%,.4)' : 'none',
            }}
            aria-label="Toggle HUD mode"
          >
            <Sun size={16} className={hudMode ? 'text-hud-cyan' : 'text-white/50'} />
          </button>

          {/* Heat map toggle */}
          <button
            onClick={() => setShowHeatMap(h => !h)}
            title="Community activity heat map"
            aria-pressed={showHeatMap}
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            style={{
              background: showHeatMap ? 'hsla(0,80%,30%,.4)' : 'hsla(240,30%,8%,.88)',
              border: showHeatMap ? '1px solid hsla(0,80%,60%,.7)' : '1px solid hsla(255,30%,40%,.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: showHeatMap ? '0 0 18px hsla(0,80%,55%,.4)' : 'none',
            }}
            aria-label="Toggle activity heat map"
          >
            <Flame size={16} className={showHeatMap ? 'text-red-400' : 'text-white/50'} />
          </button>

          {/* Weather toggle */}
          <button
            onClick={() => setShowWeather(w => !w)}
            title="Beach weather conditions"
            aria-pressed={showWeather}
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            style={{
              background: showWeather ? 'hsla(38,80%,30%,.35)' : 'hsla(240,30%,8%,.88)',
              border: showWeather ? '1px solid hsla(43,100%,60%,.6)' : '1px solid hsla(255,30%,40%,.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: showWeather ? '0 0 16px hsla(43,100%,60%,.25)' : 'none',
            }}
            aria-label="Toggle weather"
          >
            <CloudRain size={16} className={showWeather ? 'text-amber-300' : 'text-white/50'} />
          </button>
        </div>

        {/* Expedition planner */}
        <div className="pointer-events-auto relative">
          <ExpeditionPlanner
            hotspots={hotspots} specimens={specimens} userLocation={userLocation}
            onRouteChange={route => { setExpeditionRoute(route); if (route.length>0) setActiveLayer('expedition'); }}
            onHotspotFocus={h => { setActiveId(h.id); setDetailHotspot(h); }}
          />
        </div>

        {showGeology && userLocation && (
          <div className="mt-2 pointer-events-auto">
            <GeologyInfoCard lat={userLocation.lat} lng={userLocation.lng} onClose={() => setShowGeology(false)} />
          </div>
        )}

        <AnimatePresence>
          {showWeather && (
            <div className="mt-2 pointer-events-auto">
              <WeatherPanel userLocation={userLocation} hudMode={hudMode} onClose={() => setShowWeather(false)} />
            </div>
          )}
        </AnimatePresence>

        {isOffline && hotspots.length > 0 && (
          <div className="mt-2 pointer-events-auto">
            <OfflineBanner cachedAt={cachedAt} count={hotspots.length} />
          </div>
        )}
      </div>

      {/* ── Hotspot detail sheet (pin tap) ── */}
      {detailHotspot && (
        <HotspotDetailSheet
          hotspot={detailHotspot}
          specimens={specimens}
          earnedCodes={earnedCodes}
          collectionGapMinerals={activeGapMinerals}
          onClose={handleCloseDetail}
        />
      )}

      {/* ── Bottom list sheet ── */}
      {!detailHotspot && (
        <div className="absolute bottom-0 inset-x-0 z-[1000] pointer-events-none">
          <AnimatePresence mode="wait">
            {sheetOpen ? (
              <motion.div key="open"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="pointer-events-auto rounded-t-3xl flex flex-col"
                style={{
                  background: 'linear-gradient(180deg,hsla(245,30%,9%,.97) 0%,hsla(240,25%,6%,.99) 100%)',
                  backdropFilter: 'blur(32px)',
                  border: '1px solid hsla(270,30%,40%,.2)', borderBottom: 'none',
                  maxHeight: '60vh',
                }}>

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
                      <p className="text-white/50 text-[10px] uppercase tracking-[.2em]">
                        {hotspots.length} total · {publicCount} open
                      </p>
                    </div>
                    <button onClick={() => setSheetOpen(false)}
                      aria-label="Close details"
                      className="w-7 h-7 rounded-full flex items-center justify-center transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
                      style={{ background: 'hsla(255,30%,20%,.5)', border: '1px solid hsla(255,30%,40%,.2)' }}>
                      <X size={14} className="text-white/50"/>
                    </button>
                  </div>
                  {/* Stats */}
                  <div className="flex gap-2 mb-3">
                    <StatPill value={hotspots.length}                         label="Sites"  color="#c084fc"/>
                    <StatPill value={publicCount}                              label="Open"   color="#34d399"/>
                    <StatPill value={collectionGapIds.size}                    label="Gaps"   color="#a78bfa"/>
                    <StatPill value={specimens.filter(s=>s.lat&&s.lng).length} label="Finds"  color="#22d3ee"/>
                  </div>
                </div>

                {/* Scrollable cards */}
                <div className="overflow-y-auto flex-1"
                  style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom,0px))' }}>
                  <div ref={scrollRef} className="flex gap-3 px-4 pb-4 overflow-x-auto"
                    style={{ scrollSnapType: 'x mandatory' }}>
                    {filteredHotspots.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-8 text-white/50">
                        <Layers size={24} className="mb-2 opacity-40"/>
                        <p className="text-sm">No hotspots in this layer</p>
                      </div>
                    ) : filteredHotspots.map(h => (
                      <div key={h.id} data-id={h.id} style={{ scrollSnapAlign: 'start' }}>
                        <HotspotCard
                          hotspot={h}
                          active={activeId === h.id}
                          hasGap={collectionGapIds.has(h.id)}
                          onClick={() => { setActiveId(h.id); setDetailHotspot(h); }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button key="pill"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                onClick={() => setSheetOpen(true)}
                className="pointer-events-auto mx-auto mb-28 flex items-center gap-2.5 px-5 py-3 rounded-full"
                style={{
                  background: 'hsla(245,30%,9%,.92)',
                  border: '1px solid hsla(270,40%,40%,.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px hsla(265,80%,20%,.4)',
                }}>
                {loading ? <Loader2 size={14} className="text-amethyst-glow animate-spin"/> : <Zap size={14} className="text-amethyst-glow"/>}
                <span className="text-white/80 text-sm font-semibold">
                  {loading ? 'Loading hotspots…' : 'Hotspots'}
                </span>
                <ChevronUp size={14} className="text-white/40"/>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* AR Encounter Screen */}
      <AnimatePresence>
        {activeSpawn && (
          <AREncounterScreen
            spawn={activeSpawn}
            onCatch={(spawn) => catchSpawn(spawn.id)}
            onDismiss={() => { dismissSpawn(activeSpawn?.id); setActiveSpawn(null); }}
          />
        )}
      </AnimatePresence>

      {/* Badge unlock overlay (fires when a badge is earned on the map) */}
      {pendingBadge && <BadgeUnlockAnimation badge={pendingBadge} onClose={dismissPending} />}
    </div>
  );
}