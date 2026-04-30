import React, { useEffect, useState } from 'react';
import { Fuel, Tent, Utensils, ShoppingBag, Hospital } from 'lucide-react';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const CATEGORIES = [
  { type: 'gas_station', label: 'Gas', icon: Fuel },
  { type: 'campground', label: 'Camp', icon: Tent },
  { type: 'restaurant', label: 'Food', icon: Utensils },
  { type: 'store', label: 'Supply', icon: ShoppingBag },
  { type: 'hospital', label: 'Medical', icon: Hospital },
];

export default function NearbyPlacesPanel({ lat, lng, map }) {
  const [active, setActive] = useState('gas_station');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.google?.maps?.places || !map) return;
    setLoading(true);
    setResults([]);
    const svc = new window.google.maps.places.PlacesService(map);
    svc.nearbySearch(
      {
        location: { lat, lng },
        radius: 25000,
        type: active,
      },
      (res, status) => {
        setLoading(false);
        if (status === 'OK' && Array.isArray(res)) {
          setResults(res.slice(0, 8));
        }
      }
    );
  }, [lat, lng, active, map]);

  return (
    <GlassPanel variant="hud">
      <HudFrame label="Nearby Resources">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = c.type === active;
            return (
              <button
                key={c.type}
                onClick={() => setActive(c.type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-wider border transition ${
                  isActive
                    ? 'bg-hud-cyan/25 border-hud-cyan/60 text-hud glow-hud'
                    : 'bg-black/40 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Icon size={12} />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="h-52 overflow-y-auto pr-1 -mr-1 space-y-1.5">
          {loading && (
            <div className="text-hud-cyan/60 text-xs uppercase tracking-[0.3em] text-center py-8">
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="text-white/50 text-xs text-center py-8">No results within 25km.</div>
          )}
          {results.map((r) => (
            <a
              key={r.place_id}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                r.name
              )}&query_place_id=${r.place_id}`}
              target="_blank"
              rel="noreferrer"
              className="block px-3 py-2 rounded-md bg-black/30 border border-white/5 hover:border-hud-cyan/40 transition"
            >
              <div className="text-white text-sm font-medium truncate">{r.name}</div>
              <div className="text-white/50 text-[11px] truncate">
                {r.vicinity}
                {r.rating ? ` · ★ ${r.rating}` : ''}
              </div>
            </a>
          ))}
        </div>
      </HudFrame>
    </GlassPanel>
  );
}