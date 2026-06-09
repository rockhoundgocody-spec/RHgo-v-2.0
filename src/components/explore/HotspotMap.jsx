/**
 * HotspotMap — powered by react-leaflet (no API key required)
 * Replaces Google Maps which was failing due to key authorization issues.
 */
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default leaflet icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAND_COLORS = {
  public: '#34d399',
  blm: '#fbbf24',
  forest_service: '#a3e635',
  state_park: '#38bdf8',
  private: '#fb7185',
  unknown: '#94a3b8',
};

// Dark tile layer — no key needed
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Pan/zoom to active hotspot — capped at zoom 10 so other markers stay visible
function ActivePanner({ hotspots, activeId }) {
  const map = useMap();
  useEffect(() => {
    if (!activeId) return;
    const h = hotspots.find(x => x.id === activeId);
    if (h?.lat && h?.lng) map.flyTo([h.lat, h.lng], 9, { duration: 0.7 });
  }, [activeId, hotspots, map]);
  return null;
}

// Pan to user location — capped at zoom 9 so filters stay visible
function UserPanner({ userLocation }) {
  const map = useMap();
  const initialFly = useRef(false);
  useEffect(() => {
    if (!userLocation) return;
    // Only auto-fly on first location fix; after that the user controls the map
    if (initialFly.current) return;
    initialFly.current = true;
    map.flyTo([userLocation.lat, userLocation.lng], 8, { duration: 0.8 });
  }, [userLocation, map]);
  return null;
}

export default function HotspotMap({
  hotspots = [],
  specimens = [],
  height = 480,
  activeId = null,
  onMarkerClick,
  userLocation = null,
}) {
  const isFullHeight = height === '100%';

  const points = useMemo(
    () => hotspots.filter(h => typeof h.lat === 'number' && typeof h.lng === 'number'),
    [hotspots]
  );

  const geoSpecimens = useMemo(
    () => specimens.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number'),
    [specimens]
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      style={isFullHeight
        ? { height: '100%' }
        : { height, borderRadius: '1rem', border: '1px solid hsla(195,100%,60%,0.2)' }
      }
    >
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ width: '100%', height: '100%', background: '#080d1c' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={DARK_TILE} attribution={DARK_ATTR} />

        <ActivePanner hotspots={hotspots} activeId={activeId} />
        <UserPanner userLocation={userLocation} />

        {/* Hotspot markers */}
        {points.map(h => {
          const color = LAND_COLORS[h.land_type] || LAND_COLORS.unknown;
          const isActive = h.id === activeId;
          return (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={isActive ? 11 : 8}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.92,
                color: '#ffffff',
                weight: isActive ? 2.5 : 1.5,
              }}
              eventHandlers={{ click: () => onMarkerClick && onMarkerClick(h) }}
            >
              <Popup>
                <div style={{ fontFamily: 'system-ui', fontSize: 12, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{h.name}</div>
                  <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {h.state || h.country || ''} · {(h.land_type || '').replace(/_/g, ' ')}
                  </div>
                  {h.minerals?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 4 }}>
                      {h.minerals.slice(0, 4).join(' · ')}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#475569' }}>
                    Trust {((h.trust_score || 0) * 100).toFixed(0)}% · {h.difficulty || ''}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Specimen pins */}
        {geoSpecimens.map(s => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={6}
            pathOptions={{
              fillColor: '#a78bfa',
              fillOpacity: 0.95,
              color: '#ffffff',
              weight: 1.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'system-ui', fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>🪨 {s.mineral_name}</div>
                {s.found_date && <div style={{ color: '#475569', marginTop: 2 }}>Found: {s.found_date}</div>}
                {s.rarity && <div style={{ color: '#6d28d9', fontWeight: 500, marginTop: 2 }}>{s.rarity}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* User location dot */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={9}
            pathOptions={{
              fillColor: '#22d3ee',
              fillOpacity: 1,
              color: '#ffffff',
              weight: 2,
            }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}