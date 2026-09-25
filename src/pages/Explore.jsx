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
import { Loader2, Locate, Zap, X, ChevronUp, Layers, Mountain, CloudRain, Flame, Route, Filter } from 'lucide-react';
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
import SpawnStats from '@/components/ar/SpawnStats.jsx';
import AREncounterScreen from '@/components/ar/AREncounterScreen.jsx';
import { useAuth } from '@/lib/AuthContext';
import { useSeoMeta } from '@/lib/useSeoMeta';
import { useSeoRobots } from '@/lib/useSeoRobots';
import ExpeditionTeaserModal from '@/components/explore/ExpeditionTeaserModal.jsx';
import MapFilterSheet from '@/components/explore/MapFilterSheet.jsx';
import MapSearchBar from '@/components/explore/MapSearchBar.jsx';
import ExploreEmptyState from '@/components/explore/ExploreEmptyState.jsx';
import { useNavigate } from 'react-router-dom';
import { formatDistance, persistLastGps, rankHotspots } from '@/lib/geo';

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
const HotspotCard = memo(function HotspotCard({ hotspot, active, hasGap, onClick, distanceMi }) {
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
          <span className="text-[9px] text-white/50">
            {distanceMi != null ? formatDistance(distanceMi) : (hotspot.state||'—')}
          </span>
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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: rawHotspots = [], isLoading: loading, isOffline, cachedAt } = useOfflineHotspots();
  // Logged-out visitors see approximate coordinates (rounded to 2 decimal places)
  const hotspots = useMemo(
    () => isAuthenticated ? rawHotspots : rawHotspots.map(h => ({
      ...h,
      lat: typeof h.lat === 'number' ? Math.round(h.lat * 100) / 100 : h.lat,
      lng: typeof h.lng === 'number' ? Math.round(h.lng * 100) / 100 : h.lng,
    })),
    [rawHotspots, isAuthenticated]
  );
  const { data: specimens = [] } = useQuery({
    queryKey: ['specimens-explore'],
    queryFn: () => base44.entities.Specimen.list('-found_date', 500),
    initialData: [],
    enabled: isAuthenticated,
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
  const [activeLayer,    setActiveLayer]    = useState('all');
  const [selectedMinerals, setSelectedMinerals] = useState(new Set());
  const [expeditionRoute, setExpeditionRoute] = useState([]);
  const [showGeology,    setShowGeology]    = useState(false);
  const [geologyCardOpen, setGeologyCardOpen] = useState(false);
  const hudMode = false;
  const [showWeather,    setShowWeather]    = useState(false);
  const [arActive,       setArActive]       = useState(false);
  const [activeSpawn,    setActiveSpawn]    = useState(null);
  const [showHeatMap,    setShowHeatMap]    = useState(false);
  const [teaserOpen,    setTeaserOpen]    = useState(false);
  const [teaserHotspot, setTeaserHotspot] = useState(null);
  const [filterOpen,    setFilterOpen]    = useState(false);
  const scrollRef = useRef(null);

  const { spawns, caughtToday, dailyCap, catchSpawn, dismissSpawn } = useSpawns({
    userLocation, hotspots,
  });

  // Geolocation
  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        persistLastGps(next);
        setUserLocation(next);
        setLocating(false);
      },
      ()  => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);
  useEffect(() => { locate(); }, [locate]);

  // Deep-link from Hub / Clover: ?focus=family or ?spot=id|name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === 'family') setActiveLayer('public');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const spot = params.get('spot');
    if (!spot || !hotspots.length) return;
    const key = spot.toLowerCase();
    const match = hotspots.find((h) => h.id === spot || (h.name && h.name.toLowerCase() === key));
    if (!match) return;
    setActiveId(match.id);
    if (isAuthenticated) setDetailHotspot(match);
    else { setTeaserHotspot(match); setTeaserOpen(true); }
  }, [hotspots, isAuthenticated]);

  // Collected minerals set
  const collectedMinerals = useMemo(
    () => new Set(specimens.map(s => (s.mineral_name||'').toLowerCase().trim()).filter(Boolean)),
    [specimens]
  );

  // Available minerals from hotspots — for the filter sheet
  const availableMinerals = useMemo(() => {
    const set = new Set();
    hotspots.forEach(h => (h.minerals || []).forEach(m => set.add(m)));
    return [...set].sort();
  }, [hotspots]);

  // Mineral toggle / clear handlers for the filter sheet
  const toggleMineral = useCallback((mineral) => {
    setSelectedMinerals(prev => {
      const next = new Set(prev);
      if (next.has(mineral)) next.delete(mineral);
      else next.add(mineral);
      return next;
    });
  }, []);
  const clearMinerals = useCallback(() => setSelectedMinerals(new Set()), []);

  // Collection gap hotspot IDs (logged-out users have no collection → no gaps)
  const collectionGapIds = useMemo(() => {
    if (!isAuthenticated || collectedMinerals.size === 0) return new Set();
    const ids = new Set();
    hotspots.forEach(h => {
      const missing = (h.minerals||[]).filter(m => m && !collectedMinerals.has(m.toLowerCase()));
      if (missing.length >= 2) ids.add(h.id);
    });
    return ids;
  }, [hotspots, collectedMinerals, isAuthenticated]);

  // Active gap minerals for detail sheet
  const activeGapMinerals = useMemo(() => {
    if (!detailHotspot) return [];
    return (detailHotspot.minerals||[]).filter(m => !collectedMinerals.has(m.toLowerCase()));
  }, [detailHotspot, collectedMinerals]);

  // SEO: 3 mineral names from nearest hotspots for og:description
  const seoMinerals = useMemo(() => {
    const sorted = userLocation
      ? [...hotspots].sort((a, b) =>
          Math.hypot((a.lat||0) - userLocation.lat, (a.lng||0) - userLocation.lng) -
          Math.hypot((b.lat||0) - userLocation.lat, (b.lng||0) - userLocation.lng))
      : hotspots;
    const minerals = [];
    const seen = new Set();
    for (const h of sorted) {
      for (const m of (h.minerals || [])) {
        if (m && !seen.has(m)) { seen.add(m); minerals.push(m); }
        if (minerals.length >= 3) break;
      }
      if (minerals.length >= 3) break;
    }
    return minerals;
  }, [hotspots, userLocation]);

  useSeoRobots(true);
  useSeoMeta(
    'Find minerals near you - RockHound-GO',
    seoMinerals.length > 0
      ? `Discover real mineral hotspots near you — find ${seoMinerals.join(', ')} and more. AI scan, hotspot maps & collection tracking.`
      : 'Discover real mineral hotspots near you. AI scan, hotspot maps & collection tracking.'
  );

  // Sorted lowercase lookup for filtering
  const selectedMineralsLower = useMemo(
    () => new Set([...selectedMinerals].map(m => m.toLowerCase())),
    [selectedMinerals]
  );

  // Search filter
  const filteredHotspots = useMemo(() => {
    let list = hotspots;
    // Layer-specific filtering for card list
    if (activeLayer === 'rare')   list = list.filter(h => (h.minerals||[]).some(m => ['tourmaline','topaz','sapphire','emerald','ruby','alexandrite','tanzanite'].includes(m.toLowerCase())));
    if (activeLayer === 'gaps')   list = list.filter(h => collectionGapIds.has(h.id));
    if (activeLayer === 'public') list = list.filter(h => ['public','blm','forest_service','state_park'].includes(h.land_type));
    if (activeLayer === 'land')   list = list.filter(h => h.access_status && h.access_status !== 'unknown' && h.access_status !== 'open');
    if (activeLayer === 'mine')   list = list.filter(h => (h.minerals||[]).some(m => collectedMinerals.has(m.toLowerCase())));
    // Mineral type filter — only hotspots containing at least one selected mineral
    if (selectedMineralsLower.size > 0) {
      list = list.filter(h => (h.minerals || []).some(m => selectedMineralsLower.has(m.toLowerCase())));
    }
    return rankHotspots(list, { userLocation, collectedMinerals });
  }, [hotspots, activeLayer, collectionGapIds, collectedMinerals, selectedMineralsLower, userLocation]);

  const hasNearbyHotspots = useMemo(() => {
    if (!userLocation) return true;
    return rankHotspots(hotspots, { userLocation }).some((h) => h.distanceMi != null && h.distanceMi <= 75);
  }, [hotspots, userLocation]);

  const showEmptyPanel = !loading && !!userLocation && !hasNearbyHotspots;

  const handleEmptyAction = useCallback((action) => {
    if (action === 'filter') setFilterOpen(true);
    else if (action === 'land') { setShowGeology(true); setGeologyCardOpen(true); }
    else if (action === 'scan') navigate('/scan');
  }, [navigate]);

  const handleMarkerClick = useCallback(h => {
    if (!isAuthenticated) { setTeaserHotspot(h); setTeaserOpen(true); return; }
    setActiveId(h.id); setDetailHotspot(h);
  }, [isAuthenticated]);
  const handleCloseDetail = useCallback(() => { setDetailHotspot(null); setActiveId(null); }, []);
  const handleSearchSelect = useCallback((h) => { setActiveId(h.id); handleMarkerClick(h); }, [handleMarkerClick]);

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
        {isAuthenticated && arActive && (
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
        {/* Stats row — clean, no toggle buttons (moved to floating stacks) */}
        <div className="flex items-center gap-2 pointer-events-auto mb-2">
          <div className="flex-1 flex items-center px-3 py-1.5 rounded-2xl"
            style={{ background: 'hsla(240,30%,8%,.88)', border: '1px solid hsla(270,30%,40%,.3)', backdropFilter: 'blur(20px)' }}>
            {isAuthenticated && <SpawnStats spawns={spawns} caughtToday={caughtToday} dailyCap={dailyCap} />}
          </div>
        </div>

        {/* Search bar */}
        <div className="pointer-events-auto mb-2">
          <MapSearchBar hotspots={hotspots} onSelect={handleSearchSelect} />
        </div>

        {/* Expedition planner — teaser button for logged-out visitors */}
        <div className="pointer-events-auto relative">
          {isAuthenticated ? (
            <ExpeditionPlanner
              hotspots={hotspots} specimens={specimens} userLocation={userLocation}
              onRouteChange={route => { setExpeditionRoute(route); if (route.length>0) setActiveLayer('expedition'); }}
              onHotspotFocus={h => { setActiveId(h.id); setDetailHotspot(h); }}
            />
          ) : (
            <button
              onClick={() => { setTeaserHotspot(null); setTeaserOpen(true); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95"
              style={{
                background: 'hsla(240,30%,8%,0.82)',
                border: '1px solid hsla(270,30%,40%,0.25)',
                color: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <Route size={13} /> Plan Expedition
            </button>
          )}
        </div>

        <AnimatePresence>
          {showEmptyPanel && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-auto mt-2 px-1"
            >
              <ExploreEmptyState
                hotspots={hotspots}
                userLocation={userLocation}
                onSelectHotspot={handleSearchSelect}
                onAction={handleEmptyAction}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {showGeology && geologyCardOpen && userLocation && (
          <div className="mt-2 pointer-events-auto">
            <GeologyInfoCard lat={userLocation.lat} lng={userLocation.lng} onClose={() => setGeologyCardOpen(false)} />
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

      {/* ── Right-side floating: view toggles (Geology · Heat map · Weather) ── */}
      <div className="absolute right-3 z-[1000] flex flex-col gap-2 pointer-events-auto"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 76px)' }}>
        <button onClick={() => setShowGeology(g => { setGeologyCardOpen(!g); return !g; })}
          aria-label="Toggle geology view" aria-pressed={showGeology}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          style={{
            background: showGeology ? 'hsla(150,60%,30%,.3)' : 'hsla(240,30%,8%,.88)',
            border: showGeology ? '1px solid hsla(150,70%,50%,.55)' : '1px solid hsla(255,30%,40%,.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: showGeology ? '0 0 16px hsla(150,70%,50%,.25)' : 'none',
          }}>
          <Mountain size={16} className={showGeology ? 'text-emerald-300' : 'text-white/50'} />
        </button>
        <button onClick={() => setShowHeatMap(h => !h)}
          aria-label="Toggle activity heat map" aria-pressed={showHeatMap}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          style={{
            background: showHeatMap ? 'hsla(0,80%,30%,.4)' : 'hsla(240,30%,8%,.88)',
            border: showHeatMap ? '1px solid hsla(0,80%,60%,.7)' : '1px solid hsla(255,30%,40%,.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: showHeatMap ? '0 0 18px hsla(0,80%,55%,.4)' : 'none',
          }}>
          <Flame size={16} className={showHeatMap ? 'text-red-400' : 'text-white/50'} />
        </button>
        <button onClick={() => setShowWeather(w => !w)}
          aria-label="Toggle weather" aria-pressed={showWeather}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          style={{
            background: showWeather ? 'hsla(38,80%,30%,.35)' : 'hsla(240,30%,8%,.88)',
            border: showWeather ? '1px solid hsla(43,100%,60%,.6)' : '1px solid hsla(255,30%,40%,.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: showWeather ? '0 0 16px hsla(43,100%,60%,.25)' : 'none',
          }}>
          <CloudRain size={16} className={showWeather ? 'text-amber-300' : 'text-white/50'} />
        </button>
      </div>

      {/* ── Bottom-right floating: action buttons (Filter · Locate · AR · Pin) ── */}
      <div className="absolute right-3 z-[1000] flex flex-col gap-2 pointer-events-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)' }}>
        {/* Filter funnel */}
        <button onClick={() => setFilterOpen(true)}
          aria-label="Map filters"
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]"
          style={{
            background: (activeLayer !== 'all' || selectedMinerals.size > 0) ? 'hsla(160,60%,40%,.3)' : 'hsla(240,30%,8%,.88)',
            border: (activeLayer !== 'all' || selectedMinerals.size > 0) ? '1px solid hsla(160,70%,55%,.6)' : '1px solid hsla(255,30%,40%,.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: (activeLayer !== 'all' || selectedMinerals.size > 0) ? '0 0 16px hsla(160,70%,50%,.3)' : 'none',
          }}>
          <Filter size={18} className={(activeLayer !== 'all' || selectedMinerals.size > 0) ? 'text-[#9FE8D0]' : 'text-white/60'} />
        </button>
        {/* Locate */}
        <button onClick={locate} disabled={locating}
          aria-label="My location"
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
          style={{
            background: userLocation ? 'hsla(195,100%,40%,.25)' : 'hsla(240,30%,8%,.88)',
            border: userLocation ? '1px solid hsla(195,100%,60%,.5)' : '1px solid hsla(255,30%,40%,.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: userLocation ? '0 0 16px hsla(195,100%,60%,.25)' : 'none',
          }}>
          {locating ? <Loader2 size={18} className="text-hud-cyan animate-spin"/> : <Locate size={18} className={userLocation ? 'text-hud-cyan' : 'text-white/50'}/>}
        </button>
        {isAuthenticated && (
          <>
            <SpawnHUD spawns={spawns} arActive={arActive} onToggleAR={() => setArActive(a => !a)} />
            <QuickPinButton userLocation={userLocation} />
          </>
        )}
      </div>

      {/* ── Hotspot detail sheet (pin tap) — authenticated only ── */}
      {isAuthenticated && detailHotspot && (
        <HotspotDetailSheet
          hotspot={detailHotspot}
          specimens={specimens}
          earnedCodes={earnedCodes}
          collectionGapMinerals={activeGapMinerals}
          onClose={handleCloseDetail}
        />
      )}

      {/* ── Sign-up teaser modal — logged-out visitors ── */}
      <ExpeditionTeaserModal
        open={teaserOpen}
        onClose={() => { setTeaserOpen(false); setTeaserHotspot(null); }}
        minerals={teaserHotspot ? (teaserHotspot.minerals || []) : seoMinerals}
        hotspotName={teaserHotspot ? teaserHotspot.name : null}
      />

      {/* ── Bottom list sheet — authenticated only ── */}
      {isAuthenticated && !detailHotspot && (
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
                        {userLocation ? 'Nearest hunts' : 'Hotspots'}
                      </h2>
                      <p className="text-white/50 text-[10px] uppercase tracking-[.2em]">
                        {filteredHotspots.length} shown · {publicCount} open
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
                          distanceMi={h.distanceMi}
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

      {/* AR Encounter Screen — authenticated only */}
      <AnimatePresence>
        {isAuthenticated && activeSpawn && (
          <AREncounterScreen
            spawn={activeSpawn}
            onCatch={(spawn) => catchSpawn(spawn.id)}
            onDismiss={() => { dismissSpawn(activeSpawn?.id); setActiveSpawn(null); }}
          />
        )}
      </AnimatePresence>

      {/* Badge unlock overlay — authenticated only */}
      {isAuthenticated && pendingBadge && <BadgeUnlockAnimation badge={pendingBadge} onClose={dismissPending} />}

      {/* ── Map filter sheet — triggered by funnel button ── */}
      <MapFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        activeLayer={activeLayer}
        onLayerChange={(id) => setActiveLayer(id)}
        selectedMinerals={selectedMinerals}
        onToggleMineral={toggleMineral}
        onClearMinerals={clearMinerals}
        minerals={availableMinerals}
      />
    </div>
  );
}