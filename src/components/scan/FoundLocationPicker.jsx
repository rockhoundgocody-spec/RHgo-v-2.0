/**
 * FoundLocationPicker — collector chooses where a specimen was found.
 * Search hotspots, use GPS, type a place, or tap the map.
 * Value shape: { found_at, lat, lng }
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const US_CENTER = [39.5, -98.35];

function formatCoords(lat, lng) {
  if (lat == null || lng == null) return '';
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data?.address || {};
    const parts = [a.beach, a.hamlet, a.village, a.town, a.city, a.county, a.state].filter(Boolean);
    const unique = [...new Set(parts)];
    return unique.slice(0, 3).join(', ') || data?.display_name?.split(',').slice(0, 3).join(', ') || null;
  } catch {
    return null;
  }
}

async function searchPlaces(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=6`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((hit) => ({
      id: `osm-${hit.place_id}`,
      name: hit.display_name,
      lat: Number(hit.lat),
      lng: Number(hit.lon),
    }));
  } catch {
    return [];
  }
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, zoom || Math.max(map.getZoom(), 11), { animate: true });
  }, [center, zoom, map]);
  return null;
}

function InvalidateOnShow({ active }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => map.invalidateSize(), 80);
    return () => clearTimeout(t);
  }, [active, map]);
  return null;
}

export default function FoundLocationPicker({
  value,
  onChange,
  persistId,
  compact = false,
}) {
  const [query, setQuery] = useState('');
  const [sites, setSites] = useState([]);
  const [hits, setHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const debounceRef = useRef(null);

  const lat = value?.lat ?? null;
  const lng = value?.lng ?? null;
  const foundAt = value?.found_at || '';
  const center = lat != null && lng != null ? [lat, lng] : US_CENTER;

  useEffect(() => {
    let cancelled = false;
    base44.entities.Hotspot.list('-trust_score', 400)
      .then((rows) => {
        if (!cancelled) setSites(rows || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const nearbySites = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sites.filter((s) => s.lat != null && s.lng != null);
    const filtered = q
      ? list.filter((s) =>
          [s.name, s.state, s.country].filter(Boolean).join(' ').toLowerCase().includes(q))
      : list;
    return filtered.slice(0, 8);
  }, [sites, query]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 3) {
      setHits([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchPlaces(q)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const emit = useCallback(async (next) => {
    onChange?.(next);
    if (!persistId) return;
    setSaving(true);
    setError('');
    try {
      await base44.entities.Specimen.update(persistId, {
        found_at: next.found_at || '',
        lat: next.lat ?? null,
        lng: next.lng ?? null,
      });
    } catch (err) {
      setError(err?.message || "Couldn't save that location. Try again.");
    } finally {
      setSaving(false);
    }
  }, [onChange, persistId]);

  const pickCoords = useCallback(async (nextLat, nextLng, nameHint) => {
    const label = nameHint || (await reverseGeocode(nextLat, nextLng)) || formatCoords(nextLat, nextLng);
    setQuery('');
    setHits([]);
    setShowMap(true);
    await emit({ found_at: label, lat: nextLat, lng: nextLng, source: 'picked' });
  }, [emit]);

  const useGps = useCallback(() => {
    if (!navigator.geolocation) {
      setError('This browser does not provide GPS.');
      return;
    }
    setGpsBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await pickCoords(pos.coords.latitude, pos.coords.longitude);
        setGpsBusy(false);
      },
      () => {
        setError('GPS was denied or timed out. Search or tap the map instead.');
        setGpsBusy(false);
        setShowMap(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 },
    );
  }, [pickCoords]);

  const clearLocation = useCallback(async () => {
    setQuery('');
    await emit({ found_at: '', lat: null, lng: null, source: 'cleared' });
  }, [emit]);

  return (
    <div
      className={compact ? 'mb-4 space-y-2' : 'rounded-2xl p-4 space-y-3'}
      style={compact ? undefined : { background: 'hsla(0,0%,100%,0.03)', border: '1px solid hsla(160,60%,70%,0.18)' }}
    >
      <div className="flex items-center gap-2">
        <MapPin size={14} style={{ color: '#9FE8D0' }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Where you found it
        </p>
        {saving && <Loader2 size={14} className="animate-spin ml-auto" style={{ color: '#9FE8D0' }} />}
      </div>

      {foundAt || lat != null ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white break-words">{foundAt || 'Pinned on map'}</p>
            {lat != null && lng != null && (
              <p className="text-[11px] mt-0.5 text-white/40">{formatCoords(lat, lng)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={clearLocation}
            className="shrink-0 p-1.5 rounded-lg text-white/40"
            style={{ background: 'hsla(0,0%,100%,0.05)' }}
            aria-label="Clear found location"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-white/45">
          Search a site, use GPS, or tap the map so this specimen keeps its find spot.
        </p>
      )}

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}
      >
        <Search size={14} className="shrink-0 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a town, mine, or collecting site"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none min-w-0"
        />
        {searching && <Loader2 size={14} className="animate-spin shrink-0" style={{ color: '#9FE8D0' }} />}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={useGps}
          disabled={gpsBusy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(159,232,208,0.12)', border: '1px solid rgba(159,232,208,0.28)', color: '#9FE8D0' }}
        >
          {gpsBusy ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          Use my GPS
        </button>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
          style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'rgba(255,255,255,0.75)' }}
        >
          <Crosshair size={14} />
          {showMap ? 'Hide map' : 'Pick on map'}
        </button>
      </div>

      {(nearbySites.length > 0 || hits.length > 0) && query.trim() && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {nearbySites.map((site) => (
            <button
              key={site.id || site.name}
              type="button"
              onClick={() => pickCoords(site.lat, site.lng, site.name)}
              className="w-full text-left px-3 py-2 rounded-xl"
              style={{ background: 'hsla(0,0%,100%,0.03)', border: '1px solid hsla(0,0%,100%,0.06)' }}
            >
              <p className="text-xs font-semibold text-white truncate">{site.name}</p>
              <p className="text-[10px] truncate text-white/35">
                {[site.state, site.country].filter(Boolean).join(', ') || 'Known collecting site'}
              </p>
            </button>
          ))}
          {hits.map((hit) => (
            <button
              key={hit.id}
              type="button"
              onClick={() => pickCoords(hit.lat, hit.lng, hit.name.split(',').slice(0, 3).join(', '))}
              className="w-full text-left px-3 py-2 rounded-xl"
              style={{ background: 'hsla(0,0%,100%,0.03)', border: '1px solid hsla(0,0%,100%,0.06)' }}
            >
              <p className="text-xs font-semibold text-white truncate">{hit.name.split(',')[0]}</p>
              <p className="text-[10px] truncate text-white/35">{hit.name}</p>
            </button>
          ))}
        </div>
      )}

      {showMap && (
        <div className="overflow-hidden rounded-xl" style={{ height: compact ? 180 : 220, border: '1px solid rgba(159,232,208,0.2)' }}>
          <MapContainer
            center={center}
            zoom={lat != null ? 12 : 4}
            style={{ height: '100%', width: '100%', background: '#0b1118' }}
            attributionControl={false}
          >
            <TileLayer url={OSM_TILES} />
            <MapClickHandler onPick={(nextLat, nextLng) => pickCoords(nextLat, nextLng)} />
            <FlyTo center={lat != null && lng != null ? [lat, lng] : null} zoom={13} />
            <InvalidateOnShow active={showMap} />
            {lat != null && lng != null && (
              <CircleMarker
                center={[lat, lng]}
                radius={9}
                pathOptions={{ color: '#9FE8D0', fillColor: '#9FE8D0', fillOpacity: 0.85, weight: 2 }}
              />
            )}
          </MapContainer>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
