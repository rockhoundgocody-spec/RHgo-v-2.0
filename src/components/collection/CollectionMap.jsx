import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/use-google-maps';
import MapLegend, { rarityColor } from './MapLegend';
import PinCountBadge from './PinCountBadge';
import MapSpecimenCard from './MapSpecimenCard';

export default function CollectionMap({ specimens }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const { mapsReady, apiKey } = useGoogleMaps();
  const [selectedPin, setSelectedPin] = useState(null);

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
      <MapLegend />
      <PinCountBadge count={pinned.length} />
      <MapSpecimenCard specimen={selectedPin} onClose={() => setSelectedPin(null)} />
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
