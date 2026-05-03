import React, { useState } from 'react';
import { Mountain, Loader2, Locate } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import HotspotMap from '@/components/explore/HotspotMap.jsx';
import HotspotListItem from '@/components/explore/HotspotListItem.jsx';
import { Button } from '@/components/ui/button';
import { useEntityList } from '@/lib/useEntityQuery';

export default function Explore() {
  const { data: hotspots = [], isLoading: loading } = useEntityList('Hotspot');
  const [activeId, setActiveId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);

  const handleLocate = () => {
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
  };

  return (
    <div className="px-4 lg:px-8 pt-6 pb-24 max-w-7xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-wide">Explore</h1>
          <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">
            Hotspots near you
          </p>
        </div>
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

      {locError && (
        <div className="mb-4 text-rose-300 text-xs">{locError}</div>
      )}

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
                  height={480}
                  activeId={activeId}
                  onMarkerClick={(h) => setActiveId(h.id)}
                  userLocation={userLocation}
                />
                <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-hud-cyan/70 text-center">
                  {hotspots.length} sites detected
                </div>
              </>
            )}
          </HudFrame>
        </GlassPanel>

        {/* Side list */}
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
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 -mr-1">
                {hotspots.map((h) => (
                  <HotspotListItem
                    key={h.id}
                    hotspot={h}
                    active={activeId === h.id}
                    onClick={() => setActiveId(h.id)}
                  />
                ))}
              </div>
            )}
          </HudFrame>
        </GlassPanel>
      </div>
    </div>
  );
}