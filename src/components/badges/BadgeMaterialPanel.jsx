/**
 * BadgeMaterialPanel — Shows material breakdown for a badge
 * (liquid glass, natural stone, metallic inlay, crystal core, geo topo, particles)
 */
import React from 'react';
import { MATERIAL_DEFS, COLOR_SCHEMES } from './LiquidMineralBadge.jsx';

const MATERIAL_ICONS = {
  liquid_glass:   { emoji: '🫧', bar: 'hsla(200,100%,65%,0.8)' },
  natural_stone:  { emoji: '🪨', bar: 'hsla(30,60%,55%,0.8)'  },
  metallic_inlay: { emoji: '✨', bar: 'hsla(45,100%,55%,0.8)'  },
  crystal_core:   { emoji: '💎', bar: 'hsla(280,90%,70%,0.8)'  },
  geo_topo:       { emoji: '🗺️', bar: 'hsla(160,80%,50%,0.8)'  },
};

const ALL_MATERIALS = [
  'liquid_glass', 'natural_stone', 'metallic_inlay', 'crystal_core', 'geo_topo',
];

// Approximate presence of each material for a badge
const MATERIAL_WEIGHTS = {
  liquid_glass:   { liquid_glass: 95, natural_stone: 15, metallic_inlay: 20, crystal_core: 60, geo_topo: 10 },
  natural_stone:  { liquid_glass: 20, natural_stone: 90, metallic_inlay: 30, crystal_core: 40, geo_topo: 55 },
  metallic_inlay: { liquid_glass: 25, natural_stone: 20, metallic_inlay: 95, crystal_core: 35, geo_topo: 15 },
  crystal_core:   { liquid_glass: 40, natural_stone: 10, metallic_inlay: 15, crystal_core: 98, geo_topo: 8  },
  geo_topo:       { liquid_glass: 15, natural_stone: 50, metallic_inlay: 10, crystal_core: 20, geo_topo: 92 },
};

export default function BadgeMaterialPanel({ badge }) {
  const scheme = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const weights = MATERIAL_WEIGHTS[badge.material] || MATERIAL_WEIGHTS.liquid_glass;
  const primaryMat = MATERIAL_DEFS[badge.material] || MATERIAL_DEFS.liquid_glass;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'linear-gradient(135deg, hsla(255,40%,10%,0.95), hsla(245,30%,8%,0.98))',
        border: `1px solid ${scheme.rim}`,
        boxShadow: `0 0 24px ${scheme.glow.replace('0.9', '0.12')}`,
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: scheme.primary, boxShadow: `0 0 6px ${scheme.glow}` }} />
        <span className="text-[9px] uppercase tracking-[0.35em] font-bold" style={{ color: scheme.secondary }}>
          Material Composition
        </span>
      </div>

      <div
        className="text-[10px] italic px-3 py-2 rounded-xl"
        style={{
          background: `${scheme.primary.replace(')', ',0.08)')}`,
          borderLeft: `2px solid ${scheme.glow.replace('0.9','0.4')}`,
          color: 'hsla(0,0%,100%,0.6)',
        }}
      >
        {primaryMat.desc}
      </div>

      <div className="space-y-2">
        {ALL_MATERIALS.map((key) => {
          const def = MATERIAL_DEFS[key];
          const icon = MATERIAL_ICONS[key];
          const pct = weights[key] || 0;
          const isPrimary = key === badge.material;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{icon.emoji}</span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isPrimary ? scheme.secondary : 'hsla(0,0%,100%,0.5)' }}
                  >
                    {def.label}
                    {isPrimary && (
                      <span
                        className="ml-1.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ background: `${scheme.primary.replace(')', ',0.2)')}`, color: scheme.secondary, border: `1px solid ${scheme.rim}` }}
                      >
                        Primary
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: isPrimary ? scheme.secondary : 'hsla(0,0%,100%,0.3)' }}>
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: isPrimary ? scheme.glow : icon.bar,
                    boxShadow: isPrimary ? `0 0 6px ${scheme.glow}` : 'none',
                    transition: 'width 0.8s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Particle layer indicator */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-sm">✦</span>
        <span className="text-[9px] text-white/35 italic">
          Ambient particles: {badge.rarity === 'legendary' ? '20' : badge.rarity === 'epic' ? '14' : badge.rarity === 'rare' ? '10' : badge.rarity === 'uncommon' ? '6' : '3'} active floaters
        </span>
      </div>
    </div>
  );
}