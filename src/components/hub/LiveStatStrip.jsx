import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { useEntityList } from '@/lib/useEntityQuery.js';

const RANK_TIERS = [
  { min: 0,   label: 'Pebble Pup',        emoji: '🐾', color: '#94a3b8' },
  { min: 3,   label: 'Flint Finder',       emoji: '🪨', color: '#34d399' },
  { min: 10,  label: 'Crystal Scout',      emoji: '💎', color: '#38bdf8' },
  { min: 25,  label: 'Quartz Commander',   emoji: '⚡', color: '#a78bfa' },
  { min: 50,  label: 'Gemstone Warlord',   emoji: '👑', color: '#fbbf24' },
  { min: 100, label: 'Volcano Vanquisher', emoji: '🌋', color: '#f97316' },
  { min: 200, label: 'Geo Legend',         emoji: '🏆', color: '#e879f9' },
];

export function getRank(count) {
  let rank = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (count >= t.min) rank = t;
  }
  return rank;
}

export default function LiveStatStrip() {
  const { data: specimens = [] } = useEntityList('Specimen', '-found_date');
  const { data: hotspots = [] } = useEntityList('Hotspot', 'name');

  const total = specimens.length;
  const unique = new Set(specimens.map((s) => s.mineral_name)).size;
  const rarePlus = specimens.filter(
    (s) => s.rarity === 'rare' || s.rarity === 'legendary'
  ).length;
  const rank = getRank(total);

  const nextTier = RANK_TIERS.find((t) => t.min > total);
  const pctToNext = nextTier
    ? Math.min(((total - rank.min) / (nextTier.min - rank.min)) * 100, 100)
    : 100;

  return (
    <GlassPanel variant="hud" className="overflow-hidden">
      <div className="grid grid-cols-4 divide-x divide-hud-cyan/15 text-center py-3">
        <StatCell v={total} l="Finds" color="hsl(195,100%,70%)" />
        <StatCell v={unique} l="Unique" color="hsl(195,100%,70%)" />
        <StatCell v={rarePlus} l="Rare+" color="hsl(280,100%,80%)" />
        <StatCell v={hotspots.length || '—'} l="Hotspots" color="hsl(195,100%,70%)" />
      </div>

      {/* Rank bar */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: rank.color }}>
            {rank.emoji} {rank.label}
          </span>
          {nextTier && (
            <span className="text-[9px] text-white/30">
              {total}/{nextTier.min} → {nextTier.label}
            </span>
          )}
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pctToNext}%`, background: rank.color }}
          />
        </div>
      </div>
    </GlassPanel>
  );
}

function StatCell({ v, l, color }) {
  return (
    <div>
      <div className="font-mono text-lg sm:text-xl glow-hud" style={{ color }}>{v}</div>
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-hud-cyan/50 mt-0.5">{l}</div>
    </div>
  );
}