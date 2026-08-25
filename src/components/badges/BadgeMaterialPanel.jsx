/**
 * BadgeMaterialPanel — Material breakdown panel matching visual style bible.
 * Shows 6 layers: Liquid Glass, Natural Stone, Metallic Inlay, Crystal Core,
 * Geo Topo Lines, Ambient Particles — with percentage bars + description.
 */
import React from 'react';
import { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';

const MATERIAL_META = [
  { key: 'liquid_glass',   emoji: '🫧', label: 'Liquid Glass',      bar: 'hsla(196,100%,62%,0.85)', desc: 'Refractive subsurface flow with light dispersion' },
  { key: 'natural_stone',  emoji: '🪨', label: 'Natural Stone',     bar: 'hsla(28,65%,52%,0.85)',   desc: 'Micro-crack granite base & mineral strata' },
  { key: 'metallic_inlay', emoji: '✨', label: 'Metallic Inlay',    bar: 'hsla(45,100%,55%,0.85)',  desc: 'Brushed gold filigree & mirror-polished bevels' },
  { key: 'crystal_core',   emoji: '💎', label: 'Crystal Core',      bar: 'hsla(280,88%,68%,0.85)',  desc: 'Translucent glowing optical caustics' },
  { key: 'geo_topo',       emoji: '🗺️', label: 'Geo Topo Lines',    bar: 'hsla(160,78%,48%,0.85)',  desc: 'Topographic contour etching & vector paths' },
  { key: 'particles',      emoji: '✦',  label: 'Ambient Particles', bar: 'hsla(48,100%,62%,0.85)', desc: 'Floating golden dust & sparkle field' },
];

// Per-primary-material composition weights
const WEIGHTS = {
  liquid_glass:   { liquid_glass: 35, natural_stone: 12, metallic_inlay: 15, crystal_core: 22, geo_topo: 6, particles: 10 },
  natural_stone:  { liquid_glass: 10, natural_stone: 42, metallic_inlay: 16, crystal_core: 12, geo_topo: 12, particles: 8 },
  metallic_inlay: { liquid_glass: 12, natural_stone: 10, metallic_inlay: 45, crystal_core: 15, geo_topo: 8, particles: 10 },
  crystal_core:   { liquid_glass: 18, natural_stone: 8,  metallic_inlay: 12, crystal_core: 48, geo_topo: 4, particles: 10 },
  geo_topo:       { liquid_glass: 12, natural_stone: 18, metallic_inlay: 10, crystal_core: 8,  geo_topo: 44, particles: 8 },
};

export default function BadgeMaterialPanel({ badge }) {
  const scheme    = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const primaryMat= badge.material || 'crystal_core';
  const comp      = WEIGHTS[primaryMat] || WEIGHTS.crystal_core;

  return (
    <div
      className="w-full rounded-2xl p-4 text-left relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, hsla(265,50%,12%,0.92), hsla(250,40%,7%,0.96))',
        border: `1px solid ${scheme.rim}`,
        boxShadow: `0 8px 32px hsla(255,60%,5%,0.6), inset 0 1px 0 hsla(0,0%,100%,0.1)`,
      }}
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amethyst-glow">
            Material Breakdown
          </span>
          <div className="text-white text-xs font-semibold mt-0.5">
            {badge.title} composition
          </div>
        </div>
        <div
          className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full"
          style={{ background: scheme.primary.replace(')', ',0.2)'), color: scheme.secondary, border: `1px solid ${scheme.rim}` }}
        >
          {primaryMat.replace('_', ' ')}
        </div>
      </div>

      {/* Layer bars */}
      <div className="space-y-2.5">
        {MATERIAL_META.map((m) => {
          const pct = comp[m.key] || 10;
          return (
            <div key={m.key} className="group">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-white/80 font-medium flex items-center gap-1.5">
                  <span>{m.emoji}</span> {m.label}
                </span>
                <span className="font-mono text-white/50">{pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: m.bar,
                    boxShadow: `0 0 6px ${m.bar}`,
                  }}
                />
              </div>
              <div className="text-[9px] text-white/35 mt-0.5 leading-tight opacity-80 group-hover:opacity-100 transition">
                {m.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
