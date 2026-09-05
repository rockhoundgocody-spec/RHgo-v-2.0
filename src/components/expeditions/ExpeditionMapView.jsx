import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Gem, MapPin, Mountain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getPinnedSpecimens } from '@/components/collection/mapSpecimens';

const rarityColor = {
  common: '#a0a0b0',
  uncommon: '#6ee7b7',
  rare: '#7dd3fc',
  legendary: '#c084fc',
};

const HOTSPOT_COLOR = '#a78bfa'; // amethyst-glow

function useGoogleMapsScript() {
  const [mapsReady, setMapsReady] = useState(() => !!globalThis.window?.google?.maps?.Map);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined' && window.GOOGLE_MAPS_API_KEY) return window.GOOGLE_MAPS_API_KEY;
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return null;
  });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (apiKey) return;
    base44.functions.invoke('getMapsKey', {})
      .then((r) => {
        const key = r?.data?.apiKey || r?.data?.key;
        if (key) setApiKey(key);
        else setLoadError(true);
      })
      .catch(() => setLoadError(true));
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps?.Map) { setMapsReady(true); return; }
    const existing = document.querySelector('script[data-rockhound-gmaps]');
    if (existing) {
      let attempts = 0;
      const poll = setInterval(() => {
        if (window.google?.maps?.Map) { clearInterval(poll); setMapsReady(true); }
        else if (++attempts >= 100) { clearInterval(poll); setLoadError(true); }
      }, 100);
      return () => clearInterval(poll);
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places,geometry`;
    script.async = true;
    script.dataset.rockhoundGmaps = '1';
    script.onload = () => setMapsReady(true);
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);
  }, [apiKey]);

  return { mapsReady, apiKey, loadError };
}

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
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
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

  // Init map
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;
    const center = allPins.length
      ? { lat: allPins[0].lat, lng: allPins[0].lng }
      : { lat: 39.5, lng: -98.35 };
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: allPins.length === 1 ? 10 : 5,
      mapTypeId: 'terrain',
      disableDefaultUI: true,
      zoomControl: true,
      styles: darkMapStyle,
    });
    mapInstanceRef.current = map;
  }, [mapsReady, allPins]);

  // Drop markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsReady) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (!allPins.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    allPins.forEach((pin) => {
      const isSpecimen = pin.__type === 'specimen';
      const marker = new window.google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: mapInstanceRef.current,
        title: pin.title,
        icon: isSpecimen
          ? {
              path: window.google.maps.SymbolPath.CIRCLE,
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
      });
      marker.addListener('click', () => setSelectedPin(pin));
      markersRef.current.push(marker);
      bounds.extend({ lat: pin.lat, lng: pin.lng });
    });

    if (allPins.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { top: 48, right: 24, bottom: 48, left: 24 });
    }

    return () => {
      markersRef.current.forEach((marker) => {
        window.google.maps.event?.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [mapsReady, allPins]);

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

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8080a0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#16213e' }] },
];