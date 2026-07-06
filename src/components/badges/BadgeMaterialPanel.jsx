/**
 * BadgeMaterialPanel — Exact material breakdown panel from reference image.
 * Shows 6 layers: Liquid Glass, Natural Stone, Metallic Inlay, Crystal Core,
 * Geo Topo Lines, Ambient Particles — with percentage bars + description.
 */
import React from 'react';
import { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';

const MATERIAL_META = {
  liquid_glass:   { emoji: '🫧', label: 'Liquid Glass',    bar: 'hsla(196,100%,62%,0.85)', desc: 'Refractive subsurface flow' },
  natural_stone:  { emoji: '🪨', label: 'Natural Stone',   bar: 'hsla(28,65%,52%,0.85)',   desc: 'Micro-crack granite texture' },
  metallic_inlay: { emoji: '✨', label: 'Metallic Inlay',  bar: 'hsla(45,100%,55%,0.85)',  desc: 'Brushed gold filigree' },
  crystal_core:   { emoji: '💎', label: 'Crystal Core',    bar: 'hsla(280,88%,68%,0.85)',  desc: 'Optical caustics + facets' },
  geo_topo:       { emoji: '🗺️', label: 'Geo Topo Lines',  bar: 'hsla(160,78%,48%,0.85)',  desc: 'Topographic contour etching' },
  particles:      { emoji: '✦',  label: 'Ambient Particles', bar: 'hsla(48,100%,62%,0.85)', desc: 'Floating golden dust' },
};

// Per-primary-material composition weights
const WEIGHTS = {
  liquid_glass:   { liquid_glass: 92, natural_stone: 18, metallic_inlay: 22, crystal_core: 58, geo_topo: 12, particles: 65 },
  natural_stone:  { liquid_glass: 22, natural_stone: 88, metallic_inlay: 32, crystal_core: 42, geo_topo: 58, particles: 40 },
  metallic_inlay: { liquid_glass: 28, natural_stone: 22, metallic_inlay: 94, crystal_core: 38, geo_topo: 18, particles: 55 },
  crystal_core:   { liquid_glass: 42, natural_stone: 12, metallic_inlay: 18, crystal_core: 96, geo_topo: 10, particles: 72 },
  geo_topo:       { liquid_glass: 18, natural_stone: 52, metallic_inlay: 12, crystal_core: 24, geo_topo: 90, particles: 35 },
};

const PARTICLE_COUNT = { common: 4, uncommon: 8, rare: 13, epic: 18, legendary: 24 };

export default function BadgeMaterialPanel({ badge }) {
  const scheme  = COLOR_SCHEMES[badge?.colorScheme] || COLOR_SCHEMES.amethyst;
  const weights = WEIGHTS[badge?.material] || WEIGHTS.liquid_glass;
  const pCount  = PARTICLE_COUNT[badge?.rarity] || 4;

  return (
    <div
      className="rounded-2xl p-4 space-y-2.5"
      style={{
        background: 'linear-gradient(145deg, hsla(258,42%,8%,0.98), hsla(245,32%,5%,0.99))',
        border: `1px solid ${scheme.rim}`,
        boxShadow: `0 0 28px ${scheme.glow.replace('0.92','0.10')}, inset 0 1px 0 hsla(0,0%,100%,0.05)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full"
          style={{ background: scheme.primary, boxShadow: `0 0 6px ${scheme.glow}` }} />
        <span className="text-[9px] uppercase tracking-[0.38em] font-bold" style={{ color: scheme.secondary }}>
          Material Composition
        </span>
      </div>

      {/* Primary material highlight */}
      <div className="px-3 py-2.5 rounded-xl" style={{
        background: `${scheme.primary.replace(')', ',0.09)')}`,
        borderLeft: `2px solid ${scheme.glow.replace('0.92','0.55')}`,
      }}>
        <div className="text-[10px] font-bold" style={{ color: scheme.secondary }}>
          {MATERIAL_META[badge?.material]?.label || 'Liquid Glass'}
          <span className="ml-2 text-[8px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${scheme.primary.replace(')', ',0.22)')}`, color: scheme.secondary, border: `1px solid ${scheme.rim.replace('0.65','0.4')}` }}>
            Primary
          </span>
        </div>
        <div className="text-[9px] text-white/45 italic mt-0.5">
          {MATERIAL_META[badge?.material]?.desc}
        </div>
      </div>

      {/* All 6 material bars */}
      <div className="space-y-2 pt-1">
        {Object.entries(MATERIAL_META).map(([key, meta]) => {
          const pct       = key === 'particles' ? Math.round(pCount / 24 * 100) : (weights[key] || 0);
          const isPrimary = key === badge?.material;
          const barColor  = isPrimary ? scheme.glow : meta.bar;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none w-5 text-center">{meta.emoji}</span>
                  <span className="text-[10px] font-semibold"
                    style={{ color: isPrimary ? scheme.secondary : 'hsla(0,0%,100%,0.48)' }}>
                    {meta.label}
                  </span>
                </div>
                <span className="text-[9px] font-mono tabular-nums"
                  style={{ color: isPrimary ? scheme.secondary : 'hsla(0,0%,100%,0.28)' }}>
                  {key === 'particles' ? `${pCount} pts` : `${pct}%`}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,100%,0.07)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: barColor,
                    boxShadow: isPrimary ? `0 0 6px ${barColor}` : 'none',
                    transitionDuration: '0.9s',
                    transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="pt-1 flex items-center gap-1.5 text-[8px] text-white/20 italic">
        <span>✦</span>
        {pCount} ambient particle emitters active
        <span>·</span>
        {badge?.rarity} tier
      </div>
    </div>
  );
}