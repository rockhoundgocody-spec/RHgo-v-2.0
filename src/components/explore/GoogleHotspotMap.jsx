/**
 * GoogleHotspotMap — Google Maps JS API version of the Explore map.
 *
 * Drop-in replacement for HotspotMap: same props, but renders on a real
 * Google Maps basemap (dark-styled) instead of Leaflet/CARTO tiles. The API
 * key is fetched at runtime from the auth-gated getMapsKey backend function
 * and the Maps JS script is injected once, globally.
 */
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

export const LAND_COLORS = {
  public:         '#34d399',
  blm:            '#fbbf24',
  forest_service: '#a3e635',
  state_park:     '#38bdf8',
  private:        '#fb7185',
  unknown:        '#94a3b8',
};

const RARITY_COLOR = {
  common:    '#c084fc',
  uncommon:  '#34d399',
  rare:      '#a78bfa',
  legendary: '#f59e0b',
};

// Dark basemap style matching the app's amethyst/cyan HUD aesthetic.
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1326' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1326' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7b86a8' }] },
  { featureType: 'water', stylers: [{ color: '#0a1428' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2238' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7898' }] },
  { featureType: 'poi', stylers: [{ color: '#101830' }] },
  { featureType: 'poi.park', stylers: [{ color: '#102a1c' }] },
  { featureType: 'transit', stylers: [{ color: '#101830' }] },
  { featureType: 'landscape', stylers: [{ color: '#0d1326' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#7b86a8' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#9aa6c8' }] },
];

// ── One-time Google Maps JS API loader (shared across all instances) ─────────
let apiLoader = null;
function loadMapsApi() {
  if (apiLoader) return apiLoader;
  apiLoader = (async () => {
    const res = await base44.functions.invoke('getMapsKey', {});
    const key = res?.data?.key;
    if (!key) throw new Error('Google Maps key unavailable');
    if (window.google?.maps) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(s);
    });
  })();
  return apiLoader;
}

export default function GoogleHotspotMap({
  hotspots      = [],
  specimens     = [],
  clubs         = [],
  height        = 480,
  activeId      = null,
  onMarkerClick,
  userLocation  = null,
  activeLayer   = 'all',
  collectionGapIds = new Set(),
  expeditionRoute  = [],
  showGeology      = false,
  hudMode          = false,
  selectedMineralFilter = new Set(),
  showHeatMap       = false,
}) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const userMarkerRef = useRef(null);
  const polylineRef  = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  // ── Init map ──
  useEffect(() => {
    let cancelled = false;
    loadMapsApi().then(() => {
      if (cancelled || !containerRef.current) return;
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: { lat: 39.5, lng: -98.35 },
        zoom: 4,
        styles: DARK_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        backgroundColor: '#080d1c',
      });
      setReady(true);
    }).catch((e) => { if (!cancelled) setError(e.message || 'Map error'); });
    return () => { cancelled = true; };
  }, []);

  // ── Geology → Google terrain view ──
  useEffect(() => {
    if (!ready) return;
    mapRef.current.setMapTypeId(showGeology ? 'terrain' : 'roadmap');
    mapRef.current.setOptions({ styles: showGeology ? null : DARK_STYLE });
  }, [ready, showGeology]);

  // ── Filtered hotspot points (same logic as the Leaflet version) ──
  const points = useMemo(
    () => hotspots.filter(h => typeof h.lat === 'number' && typeof h.lng === 'number'),
    [hotspots]
  );
  const visiblePoints = useMemo(() => {
    let list;
    switch (activeLayer) {
      case 'rare':
        list = points.filter(h => (h.minerals || []).some(m =>
          /quartz|garnet|tourmaline|topaz|sapphire/i.test(m)));
        break;
      case 'gaps':
        list = points.filter(h => collectionGapIds.has(h.id));
        break;
      case 'public':
        list = points.filter(h => ['public','blm','forest_service','state_park'].includes(h.land_type));
        break;
      default:
        list = points;
    }
    if (selectedMineralFilter.size > 0) {
      list = list.filter(h => (h.minerals || []).some(m => selectedMineralFilter.has(m.toLowerCase())));
    }
    return list;
  }, [points, activeLayer, collectionGapIds, selectedMineralFilter]);

  // ── Markers (hotspots + specimens + clubs) ──
  useEffect(() => {
    if (!ready) return;
    const google = window.google;
    const map = mapRef.current;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const circleIcon = (color, scale, stroke, strokeWeight) => ({
      path: google.maps.SymbolPath.CIRCLE,
      scale, fillColor: color, fillOpacity: 0.95,
      strokeColor: stroke, strokeWeight,
    });

    // Hotspot markers
    visiblePoints.forEach(h => {
      const color    = LAND_COLORS[h.land_type] || LAND_COLORS.unknown;
      const isActive = h.id === activeId;
      const hasGap   = collectionGapIds.has(h.id);
      const marker = new google.maps.Marker({
        position: { lat: h.lat, lng: h.lng },
        map,
        icon: circleIcon(
          hasGap ? '#c084fc' : color,
          isActive ? 8 : 6,
          isActive ? '#ffffff' : hasGap ? '#c084fc' : 'rgba(255,255,255,0.7)',
          isActive ? 3 : 1.5
        ),
        zIndex: isActive ? 1000 : hasGap ? 500 : 1,
      });
      marker.addListener('click', () => onMarkerClick?.(h));
      markersRef.current.push(marker);
    });

    // Specimen finds (personal) — shown on all + gaps layers
    if (activeLayer === 'all' || activeLayer === 'gaps') {
      specimens
        .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
        .forEach(s => {
          const color = RARITY_COLOR[s.rarity] || RARITY_COLOR.common;
          const marker = new google.maps.Marker({
            position: { lat: s.lat, lng: s.lng },
            map,
            icon: {
              path: 'M 0,-7 L 7,0 L 0,7 L -7,0 Z',
              scale: 1,
              fillColor: color, fillOpacity: 0.9,
              strokeColor: 'rgba(255,255,255,0.6)', strokeWeight: 1,
            },
            zIndex: 1,
          });
          const iw = new google.maps.InfoWindow({
            content: `<div style="font-family:system-ui;font-size:12px;min-width:120px">` +
              `<b>🪨 ${s.mineral_name || ''}</b>` +
              (s.found_date ? `<div style="color:#64748b;margin-top:2px">Found: ${s.found_date}</div>` : '') +
              (s.rarity ? `<div style="color:#a78bfa;font-weight:500;margin-top:2px">${s.rarity}</div>` : '') +
              `</div>`,
          });
          marker.addListener('click', () => iw.open({ anchor: marker, map }));
          markersRef.current.push(marker);
        });
    }

    // Club chapter pins
    clubs.filter(c => c.lat != null && c.lng != null).forEach(c => {
      const marker = new google.maps.Marker({
        position: { lat: c.lat, lng: c.lng },
        map,
        icon: circleIcon('#14b8a6', 7, '#ffffff', 2),
        zIndex: 200,
      });
      const iw = new google.maps.InfoWindow({
        content: `<div style="font-family:system-ui;font-size:12px;min-width:140px">` +
          `<b style="color:#14b8a6">🏛️ ${c.name || ''}</b>` +
          (c.location_label ? `<div style="color:#64748b;margin-top:3px">${c.location_label}</div>` : '') +
          (c.meeting_schedule ? `<div style="color:#94a3b8;margin-top:2px;font-size:11px">${c.meeting_schedule}</div>` : '') +
          (c.member_count > 0 ? `<div style="color:#a78bfa;margin-top:2px;font-size:11px">${c.member_count} members</div>` : '') +
          `</div>`,
      });
      marker.addListener('click', () => iw.open({ anchor: marker, map }));
      markersRef.current.push(marker);
    });
  }, [ready, visiblePoints, activeId, activeLayer, specimens, clubs, collectionGapIds, onMarkerClick]);

  // ── Active hotspot pan ──
  useEffect(() => {
    if (!ready || !activeId) return;
    const h = hotspots.find(x => x.id === activeId);
    if (h?.lat && h?.lng) mapRef.current.panTo({ lat: h.lat, lng: h.lng });
  }, [ready, activeId, hotspots]);

  // ── User location marker + initial pan ──
  useEffect(() => {
    if (!ready) return;
    const google = window.google;
    if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
    if (!userLocation) return;
    userMarkerRef.current = new google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8, fillColor: '#22d3ee', fillOpacity: 0.95,
        strokeColor: '#ffffff', strokeWeight: 2.5,
      },
      zIndex: 9999,
    });
    mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    if (mapRef.current.getZoom() < 8) mapRef.current.setZoom(9);
  }, [ready, userLocation]);

  // ── Expedition route polyline ──
  useEffect(() => {
    if (!ready) return;
    const google = window.google;
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    if (expeditionRoute.length < 2) return;
    polylineRef.current = new google.maps.Polyline({
      path: expeditionRoute.map(p => ({ lat: p.lat, lng: p.lng })),
      map: mapRef.current,
      geodesic: true,
      strokeColor: '#c084fc', strokeOpacity: 0.8, strokeWeight: 3,
      icons: [{ icon: { path: 'M 0,-1 L 2,0 L 0,1 Z', scale: 2, strokeColor: '#c084fc' }, repeat: '16px' }],
    });
  }, [ready, expeditionRoute]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6"
        style={{ background: '#080d1c' }}>
        <p className="text-white/60 text-sm font-semibold">Map unavailable</p>
        <p className="text-white/35 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full"
      style={height === '100%' ? { height: '100%' } : { height, borderRadius: '1rem' }} />
  );
}