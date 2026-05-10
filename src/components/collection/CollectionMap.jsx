import React, { useEffect, useRef, useState } from 'react';
import { Gem, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const rarityColor = {
  common: '#a0a0b0',
  uncommon: '#6ee7b7',
  rare: '#7dd3fc',
  legendary: '#c084fc',
};

const rarityGlow = {
  common: 'rgba(160,160,176,0.5)',
  uncommon: 'rgba(110,231,183,0.6)',
  rare: 'rgba(125,211,252,0.6)',
  legendary: 'rgba(192,132,252,0.7)',
};

export default function CollectionMap({ specimens }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps);
  const [selectedPin, setSelectedPin] = useState(null);
  const [apiKey, setApiKey] = useState(null);

  // Fetch the Maps API key
  useEffect(() => {
    base44.functions.invoke('getMapsKey', {})
      .then((r) => setApiKey(r?.data?.key))
      .catch(() => {});
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey || window.google?.maps) {
      if (window.google?.maps) setMapsReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.onload = () => setMapsReady(true);
    document.head.appendChild(script);
  }, [apiKey]);

  // Specimens with valid coordinates
  const pinned = specimens.filter((s) => s.lat && s.lng);

  // Init map once ready
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;

    const center = pinned.length
      ? { lat: pinned[0].lat, lng: pinned[0].lng }
      : { lat: 39.5, lng: -98.35 }; // US center fallback

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: pinned.length === 1 ? 10 : 5,
      mapTypeId: 'terrain',
      disableDefaultUI: true,
      zoomControl: true,
      styles: darkMapStyle,
    });
    mapInstanceRef.current = map;
  }, [mapsReady, pinned]);

  // Drop / refresh markers whenever pinned specimens change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!pinned.length) return;

    const bounds = new window.google.maps.LatLngBounds();

    pinned.forEach((s) => {
      const color = rarityColor[s.rarity || 'common'];
      const glow = rarityGlow[s.rarity || 'common'];

      const marker = new window.google.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: mapInstanceRef.current,
        title: s.mineral_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 0.95,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
      });

      marker.addListener('click', () => setSelectedPin(s));
      markersRef.current.push(marker);
      bounds.extend({ lat: s.lat, lng: s.lng });
    });

    if (pinned.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { top: 48, right: 24, bottom: 48, left: 24 });
    }
  }, [mapsReady, pinned]);

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-3">
        <MapPin size={32} />
        <p className="text-sm">Loading map…</p>
      </div>
    );
  }

  if (pinned.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-3">
        <MapPin size={32} />
        <p className="text-sm text-center">No geo-tagged finds yet.<br />Specimens with location data will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: '60vh', minHeight: 320 }}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute top-3 left-3 glass-panel px-3 py-2 rounded-xl flex flex-col gap-1.5 text-[11px]">
        {Object.entries(rarityColor).map(([r, c]) => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: c }} />
            <span className="text-white/60 capitalize">{r}</span>
          </div>
        ))}
      </div>

      {/* Pin count badge */}
      <div className="absolute top-3 right-3 glass-panel px-3 py-1.5 rounded-full text-[11px] text-amethyst-glow font-mono">
        {pinned.length} pin{pinned.length !== 1 ? 's' : ''}
      </div>

      {/* Selected specimen card */}
      {selectedPin && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel rounded-2xl p-3 flex items-center gap-3 max-w-[280px] w-[90%] cursor-pointer"
          onClick={() => setSelectedPin(null)}
        >
          {selectedPin.image_url ? (
            <img
              src={selectedPin.image_url}
              alt={selectedPin.mineral_name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-amethyst/20 flex items-center justify-center flex-shrink-0">
              <Gem size={20} className="text-amethyst-glow" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{selectedPin.mineral_name}</div>
            {selectedPin.found_date && (
              <div className="text-white/40 text-[10px] mt-0.5">{selectedPin.found_date}</div>
            )}
            <div
              className="text-[9px] uppercase tracking-wider mt-1 font-medium"
              style={{ color: rarityColor[selectedPin.rarity || 'common'] }}
            >
              {selectedPin.rarity || 'common'}
            </div>
          </div>
        </div>
      )}
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