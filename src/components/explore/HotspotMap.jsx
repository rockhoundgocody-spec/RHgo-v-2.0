import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
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
  if (window.google?.maps?.Map) return Promise.resolve(window.google);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    document
      .querySelectorAll('script[data-rockhound-gmaps]')
      .forEach((s) => s.parentNode?.removeChild(s));

    const cbName = `__rhGmapsCb_${Date.now()}`;
    const cleanup = () => {
      try { delete window[cbName]; } catch { window[cbName] = undefined; }
    };

    window[cbName] = () => {
      cleanup();
      if (window.google?.maps?.Map) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps loaded but Map constructor missing'));
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places,geometry&loading=async&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.dataset.rockhoundGmaps = '1';
    script.onerror = () => {
      cleanup();
      loaderPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return loaderPromise;
}

// ArcGIS public services for land overlays
const BLM_TILES = 'https://gis.blm.gov/arcgis/rest/services/admin_boundaries/BLM_Natl_SMA_LimitedScale/MapServer/tile/{z}/{y}/{x}';
const PARCEL_TILES = 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Parcels/MapServer/tile/{z}/{y}/{x}';
// USGS National Geologic Map Database (SGMC2 public TMS, y-axis inverted)
const USGS_GEO_TILES = 'https://mrdata.usgs.gov/mapcache/tms/1.0.0/sgmc2/{z}/{x}/{y}.png';

function makeOverlay(google, urlTemplate, opacity = 0.55, onStatus) {
  if (typeof onStatus === 'function') {
    onStatus('pending', 'Probing tile server…');
    const probeUrl = urlTemplate.replace('{z}', 2).replace('{x}', 1).replace('{y}', 1);
    fetch(probeUrl, { method: 'GET', mode: 'no-cors' })
      .then(() => onStatus('ok', 'Tile server reachable'))
      .catch((err) => onStatus('warn', err?.message || 'Tile probe failed'));
  }

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
  specimens = [],
  height = 480,
  activeId = null,
  onMarkerClick,
  userLocation = null,
  onStatus,
}) {
  const report = useCallback(
    (key, state, label, detail) => {
      if (typeof onStatus === 'function') onStatus(key, { key, state, label, detail });
    },
    [onStatus]
  );

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const userMarkerRef = useRef(null);
  const specimenMarkersRef = useRef([]);
  const infoRef = useRef(null);
  const blmRef = useRef(null);
  const parcelRef = useRef(null);
  const geoRef = useRef(null);
  const directionsRendererRef = useRef(null);

  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [layers, setLayers] = useState({
    type: 'hybrid',
    tilt: false,
    blm: true,
    parcels: false,
    traffic: false,
    geology: false,
    cluster: true,
  });
  const [selected, setSelected] = useState(null);

  const points = useMemo(
    () => hotspots.filter((h) => typeof h.lat === 'number' && typeof h.lng === 'number'),
    [hotspots]
  );

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        report('apiKey', 'pending', 'Maps API key', 'Fetching from getMapsKey…');
        let apiKey;
        try {
          const { data } = await base44.functions.invoke('getMapsKey', {});
          apiKey = data?.apiKey;
        } catch (err) {
          if (err?.response?.status === 401) {
            report('apiKey', 'error', 'Maps API key', 'Unauthorized — please log in.');
            throw new Error('Please log in to view the map.');
          }
          report('apiKey', 'error', 'Maps API key', err?.message || 'Failed to fetch key');
          throw err;
        }
        if (!apiKey) {
          report('apiKey', 'error', 'Maps API key', 'No key returned from server');
          throw new Error('Missing API key');
        }
        report('apiKey', 'ok', 'Maps API key', 'Loaded');

        report('mapsSdk', 'pending', 'Google Maps SDK', 'Loading script…');
        let google;
        try {
          google = await loadGoogleMaps(apiKey);
        } catch (err) {
          report('mapsSdk', 'error', 'Google Maps SDK', err?.message || 'Script failed to load');
          throw err;
        }
        report('mapsSdk', 'ok', 'Google Maps SDK', 'Ready');
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

        blmRef.current = makeOverlay(google, BLM_TILES, 0.5, (state, detail) =>
          report('blmTiles', state, 'BLM land overlay', detail)
        );
        parcelRef.current = makeOverlay(google, PARCEL_TILES, 0.55, (state, detail) =>
          report('parcelTiles', state, 'Parcel overlay', detail)
        );
        // USGS geology TMS — y-axis is inverted relative to XYZ
        geoRef.current = new google.maps.ImageMapType({
          getTileUrl: ({ x, y }, z) => {
            const yTms = Math.pow(2, z) - 1 - y;
            return USGS_GEO_TILES.replace('{z}', z).replace('{x}', x).replace('{y}', yTms);
          },
          tileSize: new google.maps.Size(256, 256),
          opacity: 0.55,
          maxZoom: 14,
          name: 'geology',
        });

        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#22d3ee', strokeWeight: 4, strokeOpacity: 0.9 },
        });

        // Default BLM on
        mapRef.current.overlayMapTypes.insertAt(0, blmRef.current);

        setReady(true);
        report('map', 'ok', 'Map renderer', 'Initialized');
      } catch (e) {
        report('map', 'error', 'Map renderer', e.message);
        setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Apply layer changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    map.setMapTypeId(layers.type);
    map.setTilt(layers.tilt && (layers.type === 'satellite' || layers.type === 'hybrid') ? 45 : 0);

    // Rebuild overlay stack in deterministic order: parcels → BLM → geology (top)
    map.overlayMapTypes.clear();
    if (layers.parcels && parcelRef.current) map.overlayMapTypes.push(parcelRef.current);
    if (layers.blm && blmRef.current) map.overlayMapTypes.push(blmRef.current);
    if (layers.geology && geoRef.current) map.overlayMapTypes.push(geoRef.current);

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

  // Render markers + clustering
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;
    const google = window.google;

    // Destroy previous clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!points.length) return;

    const bounds = new google.maps.LatLngBounds();
    const newMarkers = points.map((h) => {
      const color = landColors[h.land_type] || landColors.unknown;
      const marker = new google.maps.Marker({
        position: { lat: h.lat, lng: h.lng },
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
      bounds.extend(marker.getPosition());
      return marker;
    });
    markersRef.current = newMarkers;

    if (layers.cluster) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: newMarkers,
        renderer: {
          render: ({ count, position }) =>
            new google.maps.Marker({
              position,
              label: {
                text: String(count),
                color: '#0b1020',
                fontSize: '12px',
                fontWeight: '700',
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 18,
                fillColor: '#a78bfa',
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            }),
        },
      });
    } else {
      newMarkers.forEach((m) => m.setMap(mapRef.current));
    }

    if (points.length === 1) {
      mapRef.current.setCenter({ lat: points[0].lat, lng: points[0].lng });
      mapRef.current.setZoom(10);
    } else {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [points, ready, onMarkerClick, layers.cluster]);

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

  // Specimen collection pins — cyan diamonds to distinguish from hotspot dots
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;
    const google = window.google;

    // Clear previous specimen markers
    specimenMarkersRef.current.forEach((m) => m.setMap(null));
    specimenMarkersRef.current = [];

    const geoSpecimens = specimens.filter(
      (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
    );
    if (!geoSpecimens.length) return;

    const newMarkers = geoSpecimens.map((s) => {
      const marker = new google.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: mapRef.current,
        title: s.mineral_name,
        zIndex: 100,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: '#a78bfa',
          fillOpacity: 0.95,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          rotation: 180,
        },
      });
      marker.addListener('click', () => {
        infoRef.current.setContent(`
          <div style="font-family:system-ui;font-size:12px;max-width:200px;color:#0f172a">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px">🪨 ${s.mineral_name}</div>
            ${s.found_date ? `<div style="color:#475569">Found: ${s.found_date}</div>` : ''}
            ${s.rarity ? `<div style="color:#6d28d9;font-weight:500;margin-top:2px">${s.rarity}</div>` : ''}
          </div>
        `);
        infoRef.current.open({ anchor: marker, map: mapRef.current });
      });
      return marker;
    });
    specimenMarkersRef.current = newMarkers;
  }, [specimens, ready]);

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
        if (status === 'OK') directionsRendererRef.current.setDirections(res);
      }
    );
  }, [selected, userLocation]);

  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) directionsRendererRef.current.set('directions', null);
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