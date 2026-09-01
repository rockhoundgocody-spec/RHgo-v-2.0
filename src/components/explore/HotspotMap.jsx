/**
 * HotspotMap — Enhanced interactive map with:
 * - Custom SVG div icons per land type + rarity
 * - Layer filtering (all, rare, gaps, public, expedition)
 * - Badge-glow pulse on hotspots linked to earned badges
 * - Expedition route polyline
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ActivityHeatLayer from '@/components/explore/ActivityHeatLayer.jsx';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Color maps ────────────────────────────────────────────────────────────────
export const LAND_COLORS = {
  public:         '#34d399',
  blm:            '#fbbf24',
  forest_service: '#a3e635',
  state_park:     '#38bdf8',
  private:        '#fb7185',
  unknown:        '#94a3b8',
};

const RARITY_GLOW = {
  common:    null,
  uncommon:  '#34d399',
  rare:      '#38bdf8',
  legendary: '#f59e0b',
};

const DIFF_BADGE = {
  easy:     '●',
  moderate: '◆',
  hard:     '▲',
  expert:   '★',
};

// ── Custom div icon caches ────────────────────────────────────────────────────
// Bolt Optimization: Cache Leaflet divIcons by visual property combination to preserve
// reference equality across renders, preventing React-Leaflet from executing marker.setIcon()
// and thrashing DOM nodes for unchanged markers.
const hotspotIconCache = new Map();
const specimenIconCache = new Map();
const userIconCache = new Map();
const clubIconCache = new Map();

function makeClubIcon() {
  if (clubIconCache.has('club')) return clubIconCache.get('club');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="13" fill="#0f766e" opacity="0.3">
        <animate attributeName="r" values="11;15;11" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
      </circle>
      <rect x="8" y="10" width="16" height="14" rx="2" fill="#14b8a6" opacity="0.95"
        style="filter:drop-shadow(0 0 5px #14b8a6)"/>
      <rect x="8" y="10" width="16" height="14" rx="2" fill="none" stroke="white" stroke-width="1.5"/>
      <rect x="12" y="6" width="8" height="5" rx="1" fill="#14b8a6" opacity="0.9"/>
      <circle cx="16" cy="17" r="2.5" fill="white" opacity="0.8"/>
    </svg>`;
  const icon = L.divIcon({ html: svg, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
  clubIconCache.set('club', icon);
  return icon;
}

// ── Custom div icon factory ───────────────────────────────────────────────────
// highContrast: used when the geology overlay is on — solid fills, dark halos
// and thick white rings so markers stay readable in bright sunlight.
function makeHotspotIcon({ color, isActive, isGlowing, hasGap, difficulty, highContrast }) {
  const cacheKey = `${color}:${Boolean(isActive)}:${Boolean(isGlowing)}:${Boolean(hasGap)}:${difficulty || 'none'}:${Boolean(highContrast)}`;
  if (hotspotIconCache.has(cacheKey)) {
    return hotspotIconCache.get(cacheKey);
  }

  const size   = highContrast ? (isActive ? 42 : 34) : (isActive ? 36 : 28);
  const badge  = DIFF_BADGE[difficulty] || '●';
  const ring   = hasGap ? `<circle cx="18" cy="18" r="16" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.8"/>` : '';
  const pulse  = isGlowing ? `
    <circle cx="18" cy="18" r="17" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4">
      <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
    </circle>` : '';

  const coreR = isActive ? 14 : highContrast ? 12 : 10;
  const halo  = highContrast
    ? `<circle cx="22" cy="22" r="${coreR + 4}" fill="#0a0f1e" opacity="0.85"/>`
    : '';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size + 8}" height="${size + 8}" viewBox="0 0 44 44">
      ${pulse}
      ${ring}
      ${halo}
      <circle cx="22" cy="22" r="${coreR}" fill="${color}" opacity="${highContrast ? 1 : 0.92}"
        style="filter:drop-shadow(0 0 ${isActive ? 8 : 4}px ${highContrast ? '#0a0f1e' : color})"/>
      <circle cx="22" cy="22" r="${coreR}" fill="none" stroke="${highContrast ? '#ffffff' : 'rgba(255,255,255,0.6)'}" stroke-width="${highContrast ? 3 : isActive ? 2 : 1.5}"/>
      <text x="22" y="27" text-anchor="middle" font-size="${isActive ? 13 : highContrast ? 12 : 9}" fill="white" font-weight="bold"
        ${highContrast ? 'stroke="#0a0f1e" stroke-width="0.8" paint-order="stroke"' : ''}>${badge}</text>
    </svg>`;

  const icon = L.divIcon({
    html: svg,
    className: '',
    iconSize:   [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
  hotspotIconCache.set(cacheKey, icon);
  return icon;
}

function makeSpecimenIcon(rarity, highContrast) {
  const cacheKey = `${rarity || 'common'}:${Boolean(highContrast)}`;
  if (specimenIconCache.has(cacheKey)) {
    return specimenIconCache.get(cacheKey);
  }

  const glow = RARITY_GLOW[rarity];
  const color = rarity === 'legendary' ? '#f59e0b' : rarity === 'rare' ? '#a78bfa' : '#c084fc';
  const s = highContrast ? 24 : 18;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 18 18">
      ${highContrast ? `<polygon points="9,0.5 17.5,6.5 14,16.5 4,16.5 0.5,6.5" fill="#0a0f1e" opacity="0.85"/>` : ''}
      <polygon points="9,2 16,7 13,15 5,15 2,7" fill="${color}" opacity="${highContrast ? 1 : 0.9}"
        style="filter:drop-shadow(0 0 ${glow ? 5 : 2}px ${highContrast ? '#0a0f1e' : color})"/>
      <polygon points="9,2 16,7 13,15 5,15 2,7" fill="none" stroke="${highContrast ? '#ffffff' : 'rgba(255,255,255,0.5)'}" stroke-width="${highContrast ? 1.5 : 1}"/>
    </svg>`;
  const icon = L.divIcon({ html: svg, className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
  specimenIconCache.set(cacheKey, icon);
  return icon;
}

function makeUserIcon(highContrast) {
  const cacheKey = `${Boolean(highContrast)}`;
  if (userIconCache.has(cacheKey)) {
    return userIconCache.get(cacheKey);
  }

  const s = highContrast ? 36 : 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#22d3ee" opacity="0.2">
        <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      ${highContrast ? `<circle cx="14" cy="14" r="10" fill="#0a0f1e" opacity="0.85"/>` : ''}
      <circle cx="14" cy="14" r="7" fill="#22d3ee" opacity="0.95"
        style="filter:drop-shadow(0 0 6px ${highContrast ? '#0a0f1e' : '#22d3ee'})"/>
      <circle cx="14" cy="14" r="7" fill="none" stroke="white" stroke-width="${highContrast ? 3 : 2}"/>
      <circle cx="14" cy="14" r="2.5" fill="white"/>
    </svg>`;
  const icon = L.divIcon({ html: svg, className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
  userIconCache.set(cacheKey, icon);
  return icon;
}

export function getHotspotIcon({ color, isActive, isGlowing, hasGap, difficulty, highContrast }) {
  const key = `${color}_${isActive ? 1 : 0}_${isGlowing ? 1 : 0}_${hasGap ? 1 : 0}_${difficulty || ''}_${highContrast ? 1 : 0}`;
  if (!hotspotIconCache.has(key)) {
    hotspotIconCache.set(
      key,
      makeHotspotIcon({ color, isActive, isGlowing, hasGap, difficulty, highContrast })
    );
  }
  return hotspotIconCache.get(key);
}

export function getSpecimenIcon(rarity, highContrast) {
  const key = `${rarity || 'common'}_${highContrast ? 1 : 0}`;
  if (!specimenIconCache.has(key)) {
    specimenIconCache.set(key, makeSpecimenIcon(rarity, highContrast));
  }
  return specimenIconCache.get(key);
}

export function getUserIcon(highContrast) {
  const key = `${highContrast ? 1 : 0}`;
  if (!userIconCache.has(key)) {
    userIconCache.set(key, makeUserIcon(highContrast));
  }
  return userIconCache.get(key);
}

// ── Inner map effect components ───────────────────────────────────────────────
function ActivePanner({ hotspots, activeId }) {
  const map = useMap();
  useEffect(() => {
    if (!activeId) return;
    const h = hotspots.find(x => x.id === activeId);
    if (h?.lat && h?.lng) map.flyTo([h.lat, h.lng], 10, { duration: 0.7 });
  }, [activeId, hotspots, map]);
  return null;
}

function UserPanner({ userLocation }) {
  const map  = useMap();
  const flew = useRef(false);
  useEffect(() => {
    if (!userLocation || flew.current) return;
    flew.current = true;
    map.flyTo([userLocation.lat, userLocation.lng], 9, { duration: 1.0 });
  }, [userLocation, map]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HotspotMap({
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
  earnedBadgeCodes: _earnedBadgeCodes = new Set(),
  showGeology      = false,
  hudMode          = false,
  selectedMineralFilter = new Set(),
  showHeatMap       = false,
}) {
  const isFullHeight = height === '100%';

  const points = useMemo(
    () => hotspots.filter(h => typeof h.lat === 'number' && typeof h.lng === 'number'),
    [hotspots]
  );

  const visiblePoints = useMemo(() => {
    let list;
    switch (activeLayer) {
      case 'rare':
        list = points.filter(h =>
          h.minerals?.some(m => m.toLowerCase().includes('quartz') ||
            m.toLowerCase().includes('garnet') ||
            m.toLowerCase().includes('tourmaline') ||
            m.toLowerCase().includes('topaz') ||
            m.toLowerCase().includes('sapphire'))
        );
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
    // Mineral type chip filter — applied on top of layer
    if (selectedMineralFilter.size > 0) {
      list = list.filter(h =>
        (h.minerals || []).some(m => selectedMineralFilter.has(m.toLowerCase()))
      );
    }
    return list;
  }, [points, activeLayer, collectionGapIds, selectedMineralFilter]);

  const geoSpecimens = useMemo(
    () => specimens.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number'),
    [specimens]
  );

  const userIcon = getUserIcon(showGeology || hudMode);

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
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OSM &copy; CARTO'
        />

        {/* Macrostrat bedrock geology overlay */}
        {showGeology && (
          <TileLayer
            url="https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png"
            attribution='&copy; Macrostrat'
            opacity={0.7}
          />
        )}

        <ActivePanner hotspots={hotspots} activeId={activeId} />
        <UserPanner userLocation={userLocation} />

        {/* Community activity heat map */}
        {showHeatMap && <ActivityHeatLayer specimens={specimens} />}

        {/* Expedition route polyline */}
        {expeditionRoute.length >= 2 && (
          <Polyline
            positions={expeditionRoute.map(p => [p.lat, p.lng])}
            pathOptions={{
              color: '#c084fc',
              weight: 3,
              opacity: 0.8,
              dashArray: '8 6',
            }}
          />
        )}

        {/* Hotspot markers */}
        {visiblePoints.map(h => {
          const color    = LAND_COLORS[h.land_type] || LAND_COLORS.unknown;
          const isActive = h.id === activeId;
          const hasGap   = collectionGapIds.has(h.id);
          // Glow if hotspot has a rare mineral or any earned badge references it
          const isGlowing = isActive || hasGap ||
            (h.minerals || []).some(m => m.toLowerCase().includes('tourmaline') ||
              m.toLowerCase().includes('topaz') || m.toLowerCase().includes('sapphire'));

          const icon = getHotspotIcon({
            color, isActive, isGlowing, hasGap, difficulty: h.difficulty,
            highContrast: showGeology || hudMode,
          });

          return (
            <Marker
              key={h.id}
              position={[h.lat, h.lng]}
              icon={icon}
              zIndexOffset={isActive ? 1000 : hasGap ? 500 : 0}
              eventHandlers={{ click: () => onMarkerClick && onMarkerClick(h) }}
            />
          );
        })}

        {/* Specimen finds (personal) — shown on all + gaps layers */}
        {(activeLayer === 'all' || activeLayer === 'gaps') && geoSpecimens.map(s => {
          const icon = getSpecimenIcon(s.rarity, showGeology || hudMode);
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
              <Popup>
                <div style={{ fontFamily: 'system-ui', fontSize: 12, minWidth: 120 }}>
                  <div style={{ fontWeight: 600 }}>🪨 {s.mineral_name}</div>
                  {s.found_date && <div style={{ color: '#64748b', marginTop: 2 }}>Found: {s.found_date}</div>}
                  {s.rarity && <div style={{ color: '#a78bfa', fontWeight: 500, marginTop: 2 }}>{s.rarity}</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* User location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>You are here 📍</Popup>
          </Marker>
        )}

        {/* Club chapter pins — gem & mineral clubs near you */}
        {clubs.filter(c => c.lat != null && c.lng != null).map(c => (
          <Marker
            key={`club-${c.id}`}
            position={[c.lat, c.lng]}
            icon={makeClubIcon()}
            zIndexOffset={200}
          >
            <Popup>
              <div style={{ fontFamily: 'system-ui', fontSize: 12, minWidth: 140 }}>
                <div style={{ fontWeight: 700, color: '#14b8a6' }}>🏛️ {c.name}</div>
                {c.location_label && <div style={{ color: '#64748b', marginTop: 3 }}>{c.location_label}</div>}
                {c.meeting_schedule && <div style={{ color: '#94a3b8', marginTop: 2, fontSize: 11 }}>{c.meeting_schedule}</div>}
                {c.member_count > 0 && <div style={{ color: '#a78bfa', marginTop: 2, fontSize: 11 }}>{c.member_count} members</div>}
                <a href="/clubs" style={{ color: '#c084fc', marginTop: 4, display: 'inline-block', fontSize: 11 }}>View chapter →</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}