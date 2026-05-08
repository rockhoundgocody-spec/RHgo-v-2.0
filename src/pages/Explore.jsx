import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Mountain, Loader2, Locate } from 'lucide-react';
import OfflineTilePackButton from '@/components/explore/OfflineTilePackButton.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import HotspotMap from '@/components/explore/HotspotMap.jsx';
import HotspotListItem from '@/components/explore/HotspotListItem.jsx';
import PredictiveFindsPanel from '@/components/explore/PredictiveFindsPanel.jsx';
import MapStatusPanel from '@/components/explore/MapStatusPanel.jsx';
import OfflineBanner from '@/components/explore/OfflineBanner.jsx';
import { Button } from '@/components/ui/button';
import useOfflineHotspots from '@/lib/useOfflineHotspots';
import PullToRefresh from '@/components/nav/PullToRefresh.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Explore() {
  const {
    data: hotspots = [],
    isLoading: loading,
    error: hotspotsError,
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
  const [locError, setLocError] = useState(null);

  // Map subsystem status — keyed dictionary so latest report per source wins.
  const [mapStatus, setMapStatus] = useState({});
  const handleMapStatus = useCallback((key, item) => {
    setMapStatus((prev) => ({ ...prev, [key]: item }));
  }, []);

  // Hotspots load status (driven by useEntityList).
  const hotspotsStatus = useMemo(() => {
    if (loading) return { key: 'hotspots', state: 'pending', label: 'Hotspots', detail: 'Loading from database…' };
    if (hotspotsError) return { key: 'hotspots', state: 'error', label: 'Hotspots', detail: hotspotsError?.message || 'Failed to load' };
    if (!hotspots.length) return { key: 'hotspots', state: 'warn', label: 'Hotspots', detail: 'No records returned' };
    return { key: 'hotspots', state: 'ok', label: 'Hotspots', detail: `${hotspots.length} loaded` };
  }, [loading, hotspotsError, hotspots.length]);

  // Geolocation status.
  const geoStatus = useMemo(() => {
    if (locating) return { key: 'geo', state: 'pending', label: 'Geolocation', detail: 'Requesting position…' };
    if (locError) return { key: 'geo', state: 'error', label: 'Geolocation', detail: locError };
    if (userLocation) return { key: 'geo', state: 'ok', label: 'Geolocation', detail: `${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}` };
    return { key: 'geo', state: 'warn', label: 'Geolocation', detail: 'Not requested' };
  }, [locating, locError, userLocation]);

  // Combined status list shown in the panel.
  const statusItems = useMemo(() => {
    const order = ['apiKey', 'mapsSdk', 'map', 'blmTiles', 'parcelTiles'];
    const mapItems = order
      .filter((k) => mapStatus[k])
      .map((k) => mapStatus[k]);
    return [hotspotsStatus, ...mapItems, geoStatus];
  }, [mapStatus, hotspotsStatus, geoStatus]);

  // Browser console log for power-users / contractors.
  useEffect(() => {
    const failures = statusItems.filter((i) => i.state === 'error' || i.state === 'warn');
    if (failures.length) {
      // eslint-disable-next-line no-console
      console.log('[Explore map status]', failures);
    }
  }, [statusItems]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported');
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocError(err.message || 'Unable to locate');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Auto-request GPS on mount
  useEffect(() => { locate(); }, [locate]);

  const handleLocate = locate;

  return (
    <div className="px-4 lg:px-8 pt-6 pb-24 max-w-7xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-wide">Explore</h1>
          <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">
            Hotspots near you
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <OfflineTilePackButton userLocation={userLocation} />
          <Button
            onClick={handleLocate}
            disabled={locating}
            className="bg-hud-cyan/20 hover:bg-hud-cyan/30 border border-hud-cyan/50 text-hud"
          >
            {locating ? (
              <Loader2 className="animate-spin mr-2" size={14} />
            ) : (
              <Locate size={14} className="mr-2" />
            )}
            My Location
          </Button>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {isOffline && hotspots.length > 0 && (
          <OfflineBanner cachedAt={cachedAt} count={hotspots.length} />
        )}
        <MapStatusPanel items={statusItems} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Map */}
        <GlassPanel variant="hud">
          <HudFrame label="Region Map">
            {loading ? (
              <div className="hud-grid-bg h-[480px] rounded-md flex items-center justify-center">
                <div className="text-hud text-xs tracking-[0.4em] uppercase glow-hud">
                  SCANNING…
                </div>
              </div>
            ) : (
              <>
                <HotspotMap
                  hotspots={hotspots}
                  specimens={specimens}
                  height={480}
                  activeId={activeId}
                  onMarkerClick={(h) => setActiveId(h.id)}
                  userLocation={userLocation}
                  onStatus={handleMapStatus}
                />
                <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-hud-cyan/70 text-center">
                  {hotspots.length} sites detected
                </div>
              </>
            )}
          </HudFrame>
        </GlassPanel>

        {/* Side list */}
        <div>
          <GlassPanel variant="hud">
            <HudFrame label="Nearby Sites">
              {loading ? (
                <div className="flex justify-center py-12 text-amethyst/60">
                  <Loader2 className="animate-spin" />
                </div>
              ) : hotspots.length === 0 ? (
                <div className="p-6 text-center">
                  <Mountain className="mx-auto text-amethyst/50 mb-3" size={32} />
                  <p className="text-white/70 text-sm">No hotspots seeded yet.</p>
                  <p className="text-white/40 text-xs mt-2">Visit Admin → Seed Data</p>
                </div>
              ) : (
                <PullToRefresh onRefresh={refetch} className="max-h-[480px]">
                  <div className="space-y-2 pr-1">
                    {hotspots.map((h) => (
                      <HotspotListItem
                        key={h.id}
                        hotspot={h}
                        active={activeId === h.id}
                        onClick={() => setActiveId(h.id)}
                      />
                    ))}
                  </div>
                </PullToRefresh>
              )}
            </HudFrame>
          </GlassPanel>

          <PredictiveFindsPanel userLocation={userLocation} hotspots={hotspots} />
        </div>
      </div>
    </div>
  );
}