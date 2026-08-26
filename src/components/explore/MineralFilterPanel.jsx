/**
 * MineralFilterPanel — horizontal scrollable mineral type chips.
 * "All" clears the selection; tapping individual minerals toggles them.
 * When specific minerals are active, only hotspots containing at least
 * one of the selected minerals are shown on the map and in the list.
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Mineral display config — icon emoji + display color per category
const MINERAL_META = {
  quartz:        { emoji: '🔮', color: '#a78bfa' },
  amethyst:      { emoji: '🔮', color: '#c084fc' },
  agate:         { emoji: '🎨', color: '#f472b6' },
  jasper:        { emoji: '🟤', color: '#d97706' },
  garnet:        { emoji: '🔴', color: '#ef4444' },
  tourmaline:    { emoji: '🖤', color: '#1e293b' },
  topaz:         { emoji: '🟡', color: '#fbbf24' },
  sapphire:      { emoji: '🔵', color: '#3b82f6' },
  emerald:       { emoji: '🟢', color: '#10b981' },
  ruby:          { emoji: '🔴', color: '#dc2626' },
  copper:        { emoji: '🟠', color: '#f97316' },
  gold:          { emoji: '🟨', color: '#eab308' },
  silver:        { emoji: '⚪', color: '#cbd5e1' },
  calcite:       { emoji: '⚪', color: '#e2e8f0' },
  dolomite:      { emoji: '⚪', color: '#d1d5db' },
  fluorite:      { emoji: '🟣', color: '#8b5cf6' },
  pyrite:        { emoji: '🟡', color: '#ca8a04' },
  basalt:        { emoji: '⚫', color: '#475569' },
  petoskey:      { emoji: '🐚', color: '#60a5fa' },
  fossil:        { emoji: '🦴', color: '#a3a3a3' },
};

function metaFor(mineral) {
  const key = mineral.toLowerCase().trim();
  // partial match — e.g. "Smoky Quartz" → quartz meta
  const match = Object.keys(MINERAL_META).find(k => key.includes(k));
  return match ? MINERAL_META[match] : { emoji: '💎', color: '#c084fc' };
}

export default function MineralFilterPanel({ minerals = [], selected = new Set(), onToggle, onClearAll }) {
  const reducedMotion = useReducedMotion();
  if (minerals.length === 0) return null;

  const allActive = selected.size === 0;

  return (
    <div
      className="flex gap-1.5 overflow-x-auto scrollbar-none px-1 py-1"
      role="group"
      aria-label="Mineral filters"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* All chip */}
      <motion.button
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        onClick={onClearAll}
        aria-pressed={allActive}
        className={cn(
          'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          'text-[10px] font-bold uppercase tracking-widest border transition-all motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50'
        )}
        style={{
          background: allActive ? 'hsla(280,80%,60%,0.22)' : 'hsla(240,30%,8%,0.82)',
          border: allActive ? '1px solid hsla(280,80%,70%,0.55)' : '1px solid hsla(270,30%,40%,0.25)',
          color: allActive ? 'hsl(280,90%,85%)' : 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(16px)',
          boxShadow: allActive ? '0 0 12px hsla(280,80%,60%,0.25)' : 'none',
        }}
      >
        All
      </motion.button>

      {/* Individual mineral chips */}
      {minerals.map(mineral => {
        const m = metaFor(mineral);
        const active = selected.has(mineral);
        return (
          <motion.button
            key={mineral}
            whileTap={reducedMotion ? undefined : { scale: 0.92 }}
            onClick={() => onToggle(mineral)}
            aria-pressed={active}
            className={cn(
              'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full',
              'text-[10px] font-bold uppercase tracking-wider border transition-all capitalize motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50'
            )}
            style={{
              background: active ? `${m.color}22` : 'hsla(240,30%,8%,0.82)',
              border: active ? `1px solid ${m.color}88` : '1px solid hsla(270,30%,40%,0.25)',
              color: active ? m.color : 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(16px)',
              boxShadow: active ? `0 0 12px ${m.color}44` : 'none',
            }}
          >
            <span className="text-[11px]" aria-hidden="true">{m.emoji}</span>
            {mineral}
          </motion.button>
        );
      })}
    </div>
  );
}
