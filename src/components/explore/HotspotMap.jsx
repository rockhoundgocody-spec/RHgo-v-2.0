import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const landColors = {
  public: '#34d399',
  blm: '#fbbf24',
  forest_service: '#a3e635',
  state_park: '#38bdf8',
  private: '#fb7185',
  unknown: '#94a3b8',
};

function FitBounds({ points }) {
  const map = useMap();
  React.useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 8);
      return;
    }
    const bounds = points.map((p) => [p.lat, p.lng]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function HotspotMap({ hotspots = [], height = 320 }) {
  const points = useMemo(
    () => hotspots.filter((h) => typeof h.lat === 'number' && typeof h.lng === 'number'),
    [hotspots]
  );

  const center = points[0] ? [points[0].lat, points[0].lng] : [39.5, -98.35];

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-hud-cyan/30"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', background: '#0b1020' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap & CartoDB'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds points={points} />
        {points.map((h) => {
          const color = landColors[h.land_type] || landColors.unknown;
          return (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={8}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold text-sm mb-1">{h.name}</div>
                  <div className="text-slate-600">
                    {h.state || h.country} · {h.land_type?.replace('_', ' ')}
                  </div>
                  {h.minerals?.length > 0 && (
                    <div className="mt-1 text-slate-700">
                      {h.minerals.slice(0, 4).join(', ')}
                    </div>
                  )}
                  <div className="mt-1 text-slate-500">
                    Trust {((h.trust_score || 0) * 100).toFixed(0)}% · {h.difficulty}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}