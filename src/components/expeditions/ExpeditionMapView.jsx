import React, { useMemo, useState, useCallback } from 'react';
import { Gem, MapPin, Mountain } from 'lucide-react';
import { useGoogleMapsScript } from '@/lib/useGoogleMapsScript';
import { useGoogleMap } from '@/lib/useGoogleMap';
import { rarityColor, HOTSPOT_COLOR } from '@/lib/googleMapStyles';
import { getPinnedSpecimens } from '@/components/collection/mapSpecimens';

function MapLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-3">
      <MapPin size={32} />
      <p className="text-sm">Loading map…</p>
    </div>
  );
}

function MapEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-3 px-6 text-center">
      <MapPin size={32} />
      <p className="text-sm">No geo-tagged finds or visited hotspots yet.<br />Specimens and hotspots with location data will appear here.</p>
    </div>
  );
}

function MapErrorState() {
  return (
    <div role="alert" className="flex flex-col items-center justify-center h-64 text-white/50 gap-3">
      <MapPin size={32} aria-hidden="true" />
      <p className="text-sm text-center">The expedition map could not load.</p>
    </div>
  );
}

function MapLegend() {
  return (
    <div className="absolute top-3 left-3 glass-panel px-3 py-2 rounded-xl flex flex-col gap-1.5 text-[11px]">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Gem size={11} className="text-amethyst-glow" />
        <span className="text-white/70 font-semibold">Finds</span>
      </div>
      {Object.entries(rarityColor).map(([r, c]) => (
        <div key={r} className="flex items-center gap-1.5 pl-3">
          <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: c }} />
          <span className="text-white/60 capitalize">{r}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-white/10">
        <Mountain size={11} style={{ color: HOTSPOT_COLOR }} />
        <span className="text-white/70 font-semibold">Hotspots</span>
      </div>
    </div>
  );
}

function PinCountBadge({ findCount, hotspotCount }) {
  return (
    <div className="absolute top-3 right-3 glass-panel px-3 py-1.5 rounded-full text-[11px] text-amethyst-glow font-mono flex gap-2">
      <span>{findCount} finds</span>
      <span className="text-white/30">·</span>
      <span>{hotspotCount} sites</span>
    </div>
  );
}

function SelectedPinCard({ pin, onClose }) {
  if (!pin) return null;
  const isSpecimen = pin.__type === 'specimen';
  return (
    <button
      type="button"
      aria-label={`Close details for ${pin.title}`}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel rounded-2xl p-3 flex items-center gap-3 max-w-[300px] w-[90%] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
      onClick={onClose}
    >
      {pin.image_url ? (
        <img src={pin.image_url} alt={pin.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isSpecimen ? 'hsla(275,80%,40%,0.25)' : 'hsla(275,60%,30%,0.3)' }}>
          {isSpecimen
            ? <Gem size={20} className="text-amethyst-glow" />
            : <Mountain size={20} style={{ color: HOTSPOT_COLOR }} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold truncate">{pin.title}</div>
        {pin.subtitle && <div className="text-white/40 text-[10px] mt-0.5 truncate">{pin.subtitle}</div>}
        <div className="text-[9px] uppercase tracking-wider mt-1 font-medium" style={{ color: pin.color }}>
          {pin.badge}
        </div>
      </div>
    </button>
  );
}

export default function ExpeditionMapView({ specimens = [], hotspots = [] }) {
  const [selectedPin, setSelectedPin] = useState(null);
  const { mapsReady, apiKey, loadError } = useGoogleMapsScript();

  const pinnedSpecimens = useMemo(() => getPinnedSpecimens(specimens), [specimens]);
  const pinnedHotspots = useMemo(
    () => hotspots.filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180),
    [hotspots]
  );

  const allPins = useMemo(() => [
    ...pinnedSpecimens.map((s) => ({
      ...s,
      __type: 'specimen',
      title: s.mineral_name,
      subtitle: s.found_date ? new Date(s.found_date).toLocaleDateString() : (s.common_name || ''),
      color: rarityColor[s.rarity || 'common'],
      badge: s.rarity || 'common',
    })),
    ...pinnedHotspots.map((h) => ({
      ...h,
      __type: 'hotspot',
      title: h.name,
      subtitle: [h.state, h.country].filter(Boolean).join(', '),
      color: HOTSPOT_COLOR,
      badge: h.land_type?.replace('_', ' ') || 'hotspot',
    })),
  ], [pinnedSpecimens, pinnedHotspots]);

  const getMarkerOptions = useCallback((pin) => {
    const isSpecimen = pin.__type === 'specimen';
    return {
      icon: isSpecimen
        ? {
            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
            scale: 9,
            fillColor: pin.color,
            fillOpacity: 0.95,
            strokeColor: '#fff',
            strokeWeight: 1.5,
          }
        : {
            path: 'M 0 -10 L 8 -2 L 0 10 L -8 -2 Z', // diamond
            scale: 1.1,
            fillColor: pin.color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 1.2,
          },
    };
  }, []);

  const handlePinSelect = useCallback((pin) => {
    setSelectedPin(pin);
  }, []);

  const { mapRef } = useGoogleMap({
    mapsReady,
    pins: allPins,
    getMarkerOptions,
    onPinSelect: handlePinSelect,
  });

  if (loadError) return <MapErrorState />;
  if (!apiKey) return <MapLoadingState />;
  if (allPins.length === 0) return <MapEmptyState />;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: '65vh', minHeight: 340 }}>
      <div ref={mapRef} className="w-full h-full" role="region" aria-label="Map of expedition finds and visited hotspots" />
      <MapLegend />
      <PinCountBadge findCount={pinnedSpecimens.length} hotspotCount={pinnedHotspots.length} />
      <SelectedPinCard pin={selectedPin} onClose={() => setSelectedPin(null)} />
    </div>
  );
}
