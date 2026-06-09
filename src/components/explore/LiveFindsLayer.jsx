/**
 * LiveFindsLayer — renders recent community finds as glowing map pins
 * with rock type icons. Used inside the Explore map.
 *
 * This is a logical overlay: it fetches recent Specimens that have
 * lat/lng and renders them as CircleMarkers on the Leaflet map.
 */
import React, { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';

const RARITY_COLORS = {
  common:    '#94a3b8',
  uncommon:  '#34d399',
  rare:      '#38bdf8',
  legendary: '#a78bfa',
};

// Pulsing glow circle size by rarity
const RARITY_RADIUS = {
  common:    7,
  uncommon:  9,
  rare:      11,
  legendary: 14,
};

export default function LiveFindsLayer({ specimens = [], activeLayer = 'all', userMinerals = [] }) {
  const filtered = useMemo(() => {
    return specimens.filter((s) => {
      if (!s.lat || !s.lng) return false;
      if (activeLayer === 'rare') return s.rarity === 'rare' || s.rarity === 'legendary';
      if (activeLayer === 'gaps') return !userMinerals.includes(s.mineral_name);
      return true;
    });
  }, [specimens, activeLayer, userMinerals]);

  return (
    <>
      {filtered.map((s) => {
        const color = RARITY_COLORS[s.rarity] || RARITY_COLORS.common;
        const radius = RARITY_RADIUS[s.rarity] || 7;
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.75,
              weight: 2,
              opacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
              <div style={{ fontFamily: 'system-ui', fontSize: 12, lineHeight: 1.4 }}>
                <strong>{s.mineral_name || 'Unknown'}</strong>
                <br />
                <span style={{ color, textTransform: 'capitalize' }}>{s.rarity}</span>
                {s.found_date && (
                  <>
                    <br />
                    <span style={{ color: '#aaa' }}>
                      {new Date(s.found_date).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}