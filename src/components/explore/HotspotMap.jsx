import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import MapLayerControls from './MapLayerControls.jsx';
import StreetViewPanel from './StreetViewPanel.jsx';
import NearbyPlacesPanel from './NearbyPlacesPanel.jsx';

const landColors = {
  public: '#34d399',
  blm: '#fbbf24',
  forest_service: '#a3e635',
  state_park: '#38bdf8',
  private: '#fb7185',
  unknown: '#94a3b8',
};

const darkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0b1020' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7aa2c8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1020' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a2540' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#16213a' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050a18' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0d1530' }] },
];

let loaderPromise = null;
function loadGoogleMaps(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

// ArcGIS public services for land overlays
const BLM_TILES = 'https://gis.blm.gov/arcgis/rest/services/admin_boundaries/BLM_Natl_SMA_LimitedScale/MapServer/tile/{z}/{y}/{x}';
const PARCEL_TILES = 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Parcels/MapServer/tile/{z}/{y}/{x}';

function makeOverlay(google, urlTemplate, opacity = 0.55) {
  return new google.maps.ImageMapType({
    getTileUrl: ({ x, y }, z) =>
      urlTemplate.replace('{z}', z).replace('{x}', x).replace('{y}', y),
    tileSize: new google.maps.Size(256, 256),
    opacity,
    maxZoom: 19,
    name: 'overlay',
  });
}

export default function HotspotMap({
  hotspots = [],
  height = 480,
  activeId = null,
  onMarkerClick,
  userLocation = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const infoRef = useRef(null);
  const blmRef = useRef(null);
  const parcelRef = useRef(null);
  const directionsRendererRef = useRef(null);

  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [layers, setLayers] = useState({
    type: 'hybrid', // roadmap | satellite | hybrid | terrain
    tilt: false,
    blm: true,
    parcels: false,
    traffic: false,
  });
  const [selected, setSelected] = useState(null); // for street view + nearby

  const points = useMemo(
    () => hotspots.filter((h) => typeof h.lat === 'number' && typeof h.lng === 'number'),
    [hotspots]
  );

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let apiKey;
        try {
          const { data } = await base44.functions.invoke('getMapsKey', {});
          apiKey = data?.apiKey;
        } catch (err) {
          if (err?.response?.status === 401) {
            throw new Error('Please log in to view the map.');
          }
          throw err;
        }
        if (!apiKey) throw new Error('Missing API key');
        const google = await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current) return;

        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: 39.5, lng: -98.35 },
          zoom: 4,
          mapTypeId: 'hybrid',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          tilt: 0,
          styles: darkStyle,
          backgroundColor: '#0b1020',
        });

        infoRef.current = new google.maps.InfoWindow();
        blmRef.current = makeOverlay(google, BLM_TILES, 0.5);
        parcelRef.current = makeOverlay(google, PARCEL_TILES, 0.55);
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#22d3ee', strokeWeight: 4, strokeOpacity: 0.9 },
        });

        // Default BLM on
        mapRef.current.overlayMapTypes.insertAt(0, blmRef.current);

        setReady(true);
      } catch (e) {
        setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply layer changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    map.setMapTypeId(layers.type);
    map.setTilt(layers.tilt && (layers.type === 'satellite' || layers.type === 'hybrid') ? 45 : 0);

    // Rebuild overlay stack in deterministic order
    map.overlayMapTypes.clear();
    if (layers.parcels && parcelRef.current) map.overlayMapTypes.push(parcelRef.current);
    if (layers.blm && blmRef.current) map.overlayMapTypes.push(blmRef.current);

    // Traffic
    if (layers.traffic) {
      if (!map.__trafficLayer) {
        map.__trafficLayer = new window.google.maps.TrafficLayer();
      }
      map.__trafficLayer.setMap(map);
    } else if (map.__trafficLayer) {
      map.__trafficLayer.setMap(null);
    }
  }, [layers, ready]);

  // Render markers
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;
    const google = window.google;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (!points.length) return;

    const bounds = new google.maps.LatLngBounds();
    points.forEach((h) => {
      const color = landColors[h.land_type] || landColors.unknown;
      const marker = new google.maps.Marker({
        position: { lat: h.lat, lng: h.lng },
        map: mapRef.current,
        title: h.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.85,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
        },
      });
      marker.addListener('click', () => {
        const minerals = (h.minerals || []).slice(0, 4).join(', ');
        const trust = ((h.trust_score || 0) * 100).toFixed(0);
        infoRef.current.setContent(`
          <div style="font-family:system-ui;font-size:12px;max-width:240px;color:#0f172a">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px">${h.name}</div>
            <div style="color:#475569">${h.state || h.country || ''} · ${(h.land_type || '').replace('_', ' ')}</div>
            ${minerals ? `<div style="margin-top:4px;color:#334155">${minerals}</div>` : ''}
            <div style="margin-top:4px;color:#64748b">Trust ${trust}% · ${h.difficulty || ''}</div>
          </div>
        `);
        infoRef.current.open({ anchor: marker, map: mapRef.current });
        setSelected(h);
        if (onMarkerClick) onMarkerClick(h);
      });
      marker.__hotspotId = h.id;
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (points.length === 1) {
      mapRef.current.setCenter({ lat: points[0].lat, lng: points[0].lng });
      mapRef.current.setZoom(10);
    } else {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [points, ready, onMarkerClick]);

  // Pan to active hotspot
  useEffect(() => {
    if (!ready || !activeId || !mapRef.current || !window.google?.maps) return;
    const marker = markersRef.current.find((m) => m.__hotspotId === activeId);
    if (!marker) return;
    mapRef.current.panTo(marker.getPosition());
    if (mapRef.current.getZoom() < 9) mapRef.current.setZoom(11);
    window.google.maps.event.trigger(marker, 'click');
  }, [activeId, ready]);

  // User location
  useEffect(() => {
    if (!ready || !userLocation || !mapRef.current || !window.google?.maps) return;
    const google = window.google;
    const pos = { lat: userLocation.lat, lng: userLocation.lng };
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(pos);
    } else {
      userMarkerRef.current = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: 'You',
        zIndex: 999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#22d3ee',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }
    mapRef.current.panTo(pos);
    if (mapRef.current.getZoom() < 9) mapRef.current.setZoom(10);
  }, [userLocation, ready]);

  // Directions to selected hotspot
  const handleNavigate = useCallback(() => {
    if (!selected || !userLocation || !window.google?.maps || !directionsRendererRef.current) return;
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      {
        origin: { lat: userLocation.lat, lng: userLocation.lng },
        destination: { lat: selected.lat, lng: selected.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(res);
        }
      }
    );
  }, [selected, userLocation]);

  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.set('directions', null);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-lg border border-hud-cyan/30 bg-[#0b1020]"
        style={{ height }}
      >
        <div ref={containerRef} className="absolute inset-0" />

        {ready && (
          <MapLayerControls
            layers={layers}
            onChange={setLayers}
            canNavigate={!!selected && !!userLocation}
            onNavigate={handleNavigate}
            onClearRoute={clearRoute}
          />
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-rose-300 text-xs px-4 text-center">
            Map error: {error}
          </div>
        )}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-hud-cyan/70 text-xs uppercase tracking-[0.3em]">
            Loading map…
          </div>
        )}
      </div>

      {selected && ready && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <StreetViewPanel lat={selected.lat} lng={selected.lng} name={selected.name} />
          <NearbyPlacesPanel lat={selected.lat} lng={selected.lng} map={mapRef.current} />
        </div>
      )}
    </div>
  );
}