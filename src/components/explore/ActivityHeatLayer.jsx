/**
 * ActivityHeatLayer — Snapchat-style heat map overlay showing where
 * collectors have recently found minerals. Uses CircleMarker clusters
 * bucketed by recency (24h / 7d / 30d) with rarity-weighted color + size.
 */
import React, { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';

const NOW = Date.now();
const H24 = 24 * 60 * 60 * 1000;
const D7  = 7 * H24;
const D30 = 30 * H24;

// Rarity score weights
const RARITY_WEIGHT = { legendary: 4, rare: 3, uncommon: 2, common: 1 };

// Bucket config: color, max radius, opacity
const BUCKETS = {
  hot:  { color: '#ff4d4d', glow: '#ff000088', maxR: 38, opacity: 0.55, label: 'hot'  },
  warm: { color: '#ff8c00', glow: '#ff8c0066', maxR: 28, opacity: 0.40, label: 'warm' },
  cool: { color: '#c084fc', glow: '#9333ea44', maxR: 20, opacity: 0.28, label: 'cool' },
};

/**
 * Grid cell key — snaps coordinates to ~5km grid so nearby finds cluster.
 */
function gridKey(lat, lng, precision = 0.045) {
  return `${(Math.round(lat / precision) * precision).toFixed(3)},${(Math.round(lng / precision) * precision).toFixed(3)}`;
}

export default function ActivityHeatLayer({ specimens = [] }) {
  const cells = useMemo(() => {
    // Only use geo-tagged specimens
    const geoFinds = specimens.filter(
      s => typeof s.lat === 'number' && typeof s.lng === 'number'
    );

    // Bucket each specimen into a grid cell
    const map = {};
    geoFinds.forEach(s => {
      const age = NOW - new Date(s.created_date || s.found_date || 0).getTime();
      let bucket;
      if      (age <= H24) bucket = 'hot';
      else if (age <= D7)  bucket = 'warm';
      else if (age <= D30) bucket = 'cool';
      else return; // older than 30 days — skip

      const key = gridKey(s.lat, s.lng);
      if (!map[key]) {
        map[key] = {
          lat: s.lat, lng: s.lng,
          bucket, score: 0, count: 0,
          minerals: [],
          latestDate: s.created_date || s.found_date,
        };
      }
      // Upgrade bucket if hotter find arrives
      const bucketRank = { hot: 2, warm: 1, cool: 0 };
      if (bucketRank[bucket] > bucketRank[map[key].bucket]) {
        map[key].bucket = bucket;
        map[key].lat = s.lat;
        map[key].lng = s.lng;
      }
      map[key].score += RARITY_WEIGHT[s.rarity] || 1;
      map[key].count += 1;
      if (s.mineral_name) map[key].minerals.push(s.mineral_name);
    });

    return Object.values(map);
  }, [specimens]);

  if (cells.length === 0) return null;

  return (
    <>
      {cells.map((cell, i) => {
        const cfg    = BUCKETS[cell.bucket];
        // Scale radius by score (1–10 finds → 50–100% of maxR)
        const scale  = Math.min(1, 0.5 + cell.score / 12);
        const radius = cfg.maxR * scale;
        const topMin = [...new Set(cell.minerals)].slice(0, 2).join(', ') || 'minerals';
        const label  = cell.count === 1 ? '1 find' : `${cell.count} finds`;

        return (
          <React.Fragment key={i}>
            {/* Outer glow ring */}
            <CircleMarker
              center={[cell.lat, cell.lng]}
              radius={radius * 1.55}
              pathOptions={{
                color: cfg.color,
                fillColor: cfg.glow,
                fillOpacity: 0.12,
                weight: 0,
              }}
            />
            {/* Inner heat blob */}
            <CircleMarker
              center={[cell.lat, cell.lng]}
              radius={radius}
              pathOptions={{
                color: cfg.color,
                fillColor: cfg.color,
                fillOpacity: cfg.opacity,
                weight: 1.5,
                opacity: 0.7,
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -radius]}
                opacity={1}
                permanent={false}
              >
                <div style={{
                  fontFamily: 'system-ui',
                  fontSize: 11,
                  background: 'hsla(240,30%,8%,0.96)',
                  color: cfg.color,
                  border: `1px solid ${cfg.color}55`,
                  borderRadius: 8,
                  padding: '4px 8px',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontWeight: 700 }}>{label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 4 }}>· {topMin}</span>
                  <br />
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {cell.bucket === 'hot' ? '🔥 Last 24h' : cell.bucket === 'warm' ? '🟠 This week' : '🟣 This month'}
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </>
  );
}