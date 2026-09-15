/**
 * GoogleHotspotMap — hotspot map on the Google Maps JavaScript API
 * (Advanced Markers, v=weekly). Features:
 * - Marker clustering for 378+ hotspots (groups at low zoom, splits at high zoom)
 * - Custom SVG pins per land type + rarity
 * - Layer filtering (all, rare, gaps, public, expedition)
 * - Badge-glow pulse on hotspots linked to earned badges
 * - Expedition route polyline, geology overlay, heat map
 *
 * Falls back to the Leaflet HotspotMap when the Maps API key is unavailable.
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import LeafletHotspotMap from '@/components/explore/HotspotMap.jsx';
import {
  LAND_COLORS, hotspotPinEl, specimenPinEl, userPinEl, clubPinEl, clusterPinEl,
} from '@/components/explore/googleMapIcons.js';

const RARE_MINERALS = ['quartz', 'garnet', 'tourmaline', 'topaz', 'sapphire'];

export default function GoogleHotspotMap(props) {
  const {
    hotspots = [], specimens = [], clubs = [], height = 480,
    activeId = null, onMarkerClick, userLocation = null,
    activeLayer = 'all', collectionGapIds = new Set(),
    expeditionRoute = [], showGeology = false, hudMode = false,
    selectedMineralFilter = new Set(), showHeatMap = false,
  } = props;

  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerLibRef = useRef(null);
  const infoRef      = useRef(null);
  const overlaysRef  = useRef([]);
  const clustererRef = useRef(null);
  const flewRef      = useRef(false);
  const [status, setStatus] = useState('loading');

  const isFullHeight = height === '100%';
  const highContrast = showGeology || hudMode;

  // ── Init map once ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const gmaps = await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;
        const { Map, InfoWindow } = await gmaps.importLibrary('maps');
        markerLibRef.current = await gmaps.importLibrary('marker');
        if (cancelled || !containerRef.current) return;
        mapRef.current = new Map(containerRef.current, {
          center: { lat: 39.5, lng: -98.35 },
          zoom: 4,
          mapId: 'DEMO_MAP_ID',
          colorScheme: 'DARK',
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          backgroundColor: '#080d1c',
        });
        infoRef.current = new InfoWindow();
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('fallback');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Layer + mineral filtering ──
  const visiblePoints = useMemo(() => {
    let list = hotspots.filter(h => typeof h.lat === 'number' && typeof h.lng === 'number');
    if (activeLayer === 'rare') {
      list = list.filter(h => h.minerals?.some(m => RARE_MINERALS.some(r => m.toLowerCase().includes(r))));
    } else if (activeLayer === 'gaps') {
      list = list.filter(h => collectionGapIds.has(h.id));
    } else if (activeLayer === 'public') {
      list = list.filter(h => ['public', 'blm', 'forest_service', 'state_park'].includes(h.land_type));
    }
    if (selectedMineralFilter.size > 0) {
      list = list.filter(h => (h.minerals || []).some(m => selectedMineralFilter.has(m.toLowerCase())));
    }
    return list;
  }, [hotspots, activeLayer, collectionGapIds, selectedMineralFilter]);

  const geoSpecimens = useMemo(
    () => specimens.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number'),
    [specimens]
  );

  // ── Rebuild markers + overlays whenever data changes ──
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !markerLibRef.current) return;
    const map = mapRef.current;
    const { AdvancedMarkerElement } = markerLibRef.current;
    const g = window.google.maps;

    // Clear previous non-clustered overlays
    overlaysRef.current.forEach(o => { o.map = null; if (o.setMap) o.setMap(null); });
    overlaysRef.current = [];
    const add = (o) => { overlaysRef.current.push(o); return o; };

    // Clear previous clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.setMap(null);
      clustererRef.current = null;
    }

    // ── Hotspot pins — clustered ──
    const hotspotMarkers = visiblePoints.map(h => {
      const color    = LAND_COLORS[h.land_type] || LAND_COLORS.unknown;
      const isActive = h.id === activeId;
      const hasGap   = collectionGapIds.has(h.id);
      const isGlowing = isActive || hasGap ||
        (h.minerals || []).some(m => ['tourmaline', 'topaz', 'sapphire'].some(r => m.toLowerCase().includes(r)));
      const marker = new AdvancedMarkerElement({
        position: { lat: h.lat, lng: h.lng },
        content: hotspotPinEl({ color, isActive, isGlowing, hasGap, difficulty: h.difficulty, highContrast }),
        zIndex: isActive ? 1000 : hasGap ? 500 : 1,
        title: h.name,
      });
      marker.addListener('click', () => onMarkerClick && onMarkerClick(h));
      return marker;
    });

    // Create clusterer — groups pins at low zoom, splits at zoom 8+
    clustererRef.current = new MarkerClusterer({
      map,
      markers: hotspotMarkers,
      algorithm: new SuperClusterAlgorithm({ radius: 80, maxZoom: 7 }),
      renderer: {
        render: ({ count, position }) => new AdvancedMarkerElement({
          position,
          content: clusterPinEl(count),
          zIndex: 999,
        }),
      },
    });

    // ── Personal specimen finds (not clustered) ──
    if (activeLayer === 'all' || activeLayer === 'gaps') {
      geoSpecimens.forEach(s => {
        const marker = add(new AdvancedMarkerElement({
          map,
          position: { lat: s.lat, lng: s.lng },
          content: specimenPinEl(s.rarity, highContrast),
          title: s.mineral_name,
        }));
        marker.addListener('click', () => {
          infoRef.current?.setContent(
            `<div style="font-family:system-ui;font-size:12px;min-width:120px;color:#1e293b">
              <div style="font-weight:600">🪨 ${s.mineral_name || ''}</div>
              ${s.found_date ? `<div style="color:#64748b;margin-top:2px">Found: ${s.found_date}</div>` : ''}
              ${s.rarity ? `<div style="color:#a78bfa;font-weight:500;margin-top:2px">${s.rarity}</div>` : ''}
            </div>`
          );
          infoRef.current?.open({ map, anchor: marker });
        });
      });
    }

    // ── Club chapter pins (not clustered) ──
    clubs.filter(c => c.lat != null && c.lng != null).forEach(c => {
      const marker = add(new AdvancedMarkerElement({
        map,
        position: { lat: c.lat, lng: c.lng },
        content: clubPinEl(),
        zIndex: 200,
        title: c.name,
      }));
      marker.addListener('click', () => {
        infoRef.current?.setContent(
          `<div style="font-family:system-ui;font-size:12px;min-width:140px;color:#1e293b">
            <div style="font-weight:700;color:#0f766e">🏛️ ${c.name || ''}</div>
            ${c.location_label ? `<div style="color:#64748b;margin-top:3px">${c.location_label}</div>` : ''}
            ${c.meeting_schedule ? `<div style="color:#94a3b8;margin-top:2px;font-size:11px">${c.meeting_schedule}</div>` : ''}
            <a href="/clubs" style="color:#7c3aed;margin-top:4px;display:inline-block;font-size:11px">View chapter →</a>
          </div>`
        );
        infoRef.current?.open({ map, anchor: marker });
      });
    });

    // ── User location (not clustered) ──
    if (userLocation) {
      add(new AdvancedMarkerElement({
        map,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        content: userPinEl(highContrast),
        zIndex: 2000,
        title: 'You are here',
      }));
    }

    // ── Expedition route polyline ──
    if (expeditionRoute.length >= 2) {
      add(new g.Polyline({
        map,
        path: expeditionRoute.map(p => ({ lat: p.lat, lng: p.lng })),
        strokeOpacity: 0,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.8, strokeColor: '#c084fc', strokeWeight: 3, scale: 2.5 },
          offset: '0',
          repeat: '14px',
        }],
      }));
    }

    // ── Community activity heat ──
    if (showHeatMap) {
      geoSpecimens.forEach(s => {
        add(new g.Circle({
          map,
          center: { lat: s.lat, lng: s.lng },
          radius: 30000,
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          strokeOpacity: 0,
        }));
      });
    }
  }, [status, visiblePoints, geoSpecimens, clubs, userLocation, activeId, activeLayer,
      collectionGapIds, expeditionRoute, showHeatMap, highContrast, onMarkerClick]);

  // ── Cleanup clusterer on unmount ──
  useEffect(() => {
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
    };
  }, []);

  // ── Macrostrat bedrock geology overlay ──
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;
    const map = mapRef.current;
    const g = window.google.maps;
    if (showGeology) {
      const layer = new g.ImageMapType({
        getTileUrl: (coord, zoom) => `https://tiles.macrostrat.org/carto/${zoom}/${coord.x}/${coord.y}.png`,
        tileSize: new g.Size(256, 256),
        opacity: 0.7,
        name: 'macrostrat',
      });
      map.overlayMapTypes.push(layer);
      return () => {
        const idx = map.overlayMapTypes.getArray().indexOf(layer);
        if (idx >= 0) map.overlayMapTypes.removeAt(idx);
      };
    }
  }, [status, showGeology]);

  // ── Pan to active hotspot ──
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !activeId) return;
    const h = hotspots.find(x => x.id === activeId);
    if (h?.lat && h?.lng) {
      mapRef.current.panTo({ lat: h.lat, lng: h.lng });
      mapRef.current.setZoom(10);
    }
  }, [status, activeId, hotspots]);

  // ── Fly to user on first fix ──
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !userLocation || flewRef.current) return;
    flewRef.current = true;
    mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    mapRef.current.setZoom(9);
  }, [status, userLocation]);

  if (status === 'fallback') return <LeafletHotspotMap {...props} />;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={isFullHeight
        ? { height: '100%' }
        : { height, borderRadius: '1rem', border: '1px solid hsla(195,100%,60%,0.2)' }
      }
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#080d1c' }} />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: '#080d1c' }}>
          <div className="w-10 h-10 rounded-full border-2 border-amethyst/20 border-t-amethyst-glow animate-spin" />
        </div>
      )}
    </div>
  );
}