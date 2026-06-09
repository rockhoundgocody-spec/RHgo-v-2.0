/**
 * LiquidMineralBadge — Photorealistic 3D octagonal badge renderer
 * CSS + SVG layering: liquid-glass, subsurface flow, stone textures,
 * metallic inlays, glowing crystals, ambient floating particles.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock,
} from 'lucide-react';

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP = {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock,
};

// ── Color Schemes ─────────────────────────────────────────────────────────────
export const COLOR_SCHEMES = {
  amethyst: {
    primary: 'hsl(270,80%,60%)', secondary: 'hsl(280,100%,75%)',
    glow: 'hsla(280,100%,70%,0.9)', crystal: 'hsla(270,90%,85%,0.7)',
    dark: 'hsl(255,60%,15%)', mid: 'hsl(265,50%,30%)', rim: 'hsla(280,70%,80%,0.6)',
  },
  gold: {
    primary: 'hsl(42,100%,50%)', secondary: 'hsl(48,100%,68%)',
    glow: 'hsla(45,100%,60%,0.9)', crystal: 'hsla(50,90%,80%,0.7)',
    dark: 'hsl(30,60%,10%)', mid: 'hsl(38,50%,25%)', rim: 'hsla(48,80%,70%,0.6)',
  },
  emerald: {
    primary: 'hsl(152,80%,38%)', secondary: 'hsl(162,90%,55%)',
    glow: 'hsla(155,90%,50%,0.85)', crystal: 'hsla(152,80%,75%,0.65)',
    dark: 'hsl(145,60%,8%)', mid: 'hsl(148,50%,20%)', rim: 'hsla(162,70%,65%,0.55)',
  },
  teal: {
    primary: 'hsl(185,90%,40%)', secondary: 'hsl(192,100%,60%)',
    glow: 'hsla(190,100%,55%,0.85)', crystal: 'hsla(188,90%,78%,0.65)',
    dark: 'hsl(195,60%,8%)', mid: 'hsl(190,50%,22%)', rim: 'hsla(192,80%,68%,0.55)',
  },
  violet: {
    primary: 'hsl(255,80%,55%)', secondary: 'hsl(265,90%,72%)',
    glow: 'hsla(260,100%,68%,0.9)', crystal: 'hsla(258,85%,82%,0.68)',
    dark: 'hsl(248,65%,12%)', mid: 'hsl(252,55%,28%)', rim: 'hsla(265,70%,78%,0.6)',
  },
  amber: {
    primary: 'hsl(32,100%,50%)', secondary: 'hsl(40,100%,65%)',
    glow: 'hsla(36,100%,58%,0.9)', crystal: 'hsla(38,90%,78%,0.65)',
    dark: 'hsl(25,65%,10%)', mid: 'hsl(30,55%,22%)', rim: 'hsla(42,80%,68%,0.55)',
  },
  ruby: {
    primary: 'hsl(355,80%,48%)', secondary: 'hsl(5,90%,65%)',
    glow: 'hsla(0,90%,58%,0.88)', crystal: 'hsla(358,80%,78%,0.65)',
    dark: 'hsl(350,65%,10%)', mid: 'hsl(352,55%,22%)', rim: 'hsla(5,70%,68%,0.55)',
  },
  cyan: {
    primary: 'hsl(195,100%,45%)', secondary: 'hsl(200,100%,62%)',
    glow: 'hsla(197,100%,55%,0.88)', crystal: 'hsla(196,90%,78%,0.65)',
    dark: 'hsl(205,65%,8%)', mid: 'hsl(200,55%,20%)', rim: 'hsla(200,80%,68%,0.55)',
  },
  copper: {
    primary: 'hsl(20,70%,48%)', secondary: 'hsl(28,85%,62%)',
    glow: 'hsla(24,80%,55%,0.85)', crystal: 'hsla(22,75%,72%,0.65)',
    dark: 'hsl(15,60%,10%)', mid: 'hsl(18,52%,22%)', rim: 'hsla(28,72%,62%,0.55)',
  },
  slate: {
    primary: 'hsl(220,30%,50%)', secondary: 'hsl(215,40%,68%)',
    glow: 'hsla(218,40%,60%,0.8)', crystal: 'hsla(220,35%,78%,0.6)',
    dark: 'hsl(225,35%,10%)', mid: 'hsl(222,30%,22%)', rim: 'hsla(215,38%,65%,0.5)',
  },
  jade: {
    primary: 'hsl(162,65%,38%)', secondary: 'hsl(168,80%,52%)',
    glow: 'hsla(165,75%,48%,0.85)', crystal: 'hsla(163,70%,72%,0.62)',
    dark: 'hsl(158,60%,8%)', mid: 'hsl(160,52%,18%)', rim: 'hsla(168,68%,62%,0.52)',
  },
  ocean: {
    primary: 'hsl(210,80%,45%)', secondary: 'hsl(218,90%,62%)',
    glow: 'hsla(214,90%,55%,0.88)', crystal: 'hsla(212,82%,76%,0.65)',
    dark: 'hsl(218,65%,8%)', mid: 'hsl(214,55%,20%)', rim: 'hsla(218,78%,66%,0.55)',
  },
};

// ── Material overlays ─────────────────────────────────────────────────────────
export const MATERIAL_DEFS = {
  liquid_glass: { label: 'Liquid Glass', desc: 'Refractive subsurface flow with internal caustics.' },
  natural_stone: { label: 'Natural Stone', desc: 'Layered mineral strata with micro-grain texture.' },
  metallic_inlay: { label: 'Metallic Inlay', desc: 'Hammered metal filigree with mirror polish.' },
  crystal_core: { label: 'Crystal Core', desc: 'Faceted inner gem with optical birefringence.' },
  geo_topo: { label: 'Geo Topo Lines', desc: 'Topographic contour mapping etched into surface.' },
};

// ── Rarity config ─────────────────────────────────────────────────────────────
const RARITY_CFG = {
  common:    { rings: 0, particles: 3,  glowBlur: 8  },
  uncommon:  { rings: 1, particles: 6,  glowBlur: 14 },
  rare:      { rings: 1, particles: 10, glowBlur: 20 },
  epic:      { rings: 2, particles: 14, glowBlur: 28 },
  legendary: { rings: 2, particles: 20, glowBlur: 36 },
};

// Octagon clip
const OCT = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

// ── Badge Body ────────────────────────────────────────────────────────────────
function BadgeBody({ scheme, mat, size, IconComp, iconSize }) {
  const matPatterns = {
    liquid_glass: `radial-gradient(ellipse at 35% 25%, hsla(0,0%,100%,0.28) 0%, transparent 55%), radial-gradient(ellipse at 70% 75%, ${scheme.primary.replace(')', ',0.12)')} 0%, transparent 45%)`,
    natural_stone: `repeating-linear-gradient(47deg, transparent 0px, transparent 3px, hsla(0,0%,100%,0.04) 3px, hsla(0,0%,100%,0.04) 4px)`,
    metallic_inlay: `repeating-linear-gradient(90deg, transparent 0px, transparent 6px, hsla(0,0%,100%,0.07) 6px, hsla(0,0%,100%,0.07) 7px)`,
    crystal_core: `repeating-conic-gradient(hsla(0,0%,100%,0.06) 0deg, transparent 30deg, hsla(0,0%,100%,0.1) 60deg, transparent 90deg)`,
    geo_topo: `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 8px, hsla(200,100%,80%,0.06) 8px, hsla(200,100%,80%,0.06) 9px)`,
  };

  return (
    <div
      className="relative overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        clipPath: OCT,
      }}
    >
      {/* L1: Deep base */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 40% 35%, ${scheme.mid} 0%, ${scheme.dark} 75%)` }} />

      {/* L2: Material texture */}
      <div className="absolute inset-0" style={{ background: matPatterns[mat] || matPatterns.liquid_glass, opacity: 0.22 }} />

      {/* L3: Subsurface liquid flow */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 25% 72%, ${scheme.primary.replace(')', ',0.35)')} 0%, transparent 50%), radial-gradient(ellipse at 78% 22%, ${scheme.secondary.replace(')', ',0.25)')} 0%, transparent 45%)`,
      }} />

      {/* L4: Crystal core highlight */}
      <div className="absolute" style={{
        inset: '22%',
        background: `radial-gradient(ellipse at 45% 40%, ${scheme.crystal} 0%, transparent 65%)`,
        animation: 'lmb-glow 3s ease-in-out infinite',
      }} />

      {/* L5: Specular shine */}
      <div className="absolute" style={{
        top: 0, left: 0, right: 0, height: '45%',
        background: 'linear-gradient(180deg, hsla(0,0%,100%,0.22) 0%, hsla(0,0%,100%,0.04) 60%, transparent 100%)',
      }} />

      {/* L6: Bottom rim catch-light */}
      <div className="absolute" style={{
        bottom: 0, left: '12%', right: '12%', height: '28%',
        background: `linear-gradient(0deg, ${scheme.rim} 0%, transparent 100%)`,
        filter: 'blur(4px)',
      }} />

      {/* L7: Side rim specular */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, transparent 40%, transparent 60%, hsla(0,0%,0%,0.15) 100%)`,
      }} />

      {/* L8: Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div style={{
          color: scheme.secondary,
          filter: `drop-shadow(0 0 ${iconSize * 0.45}px ${scheme.glow}) drop-shadow(0 2px ${iconSize * 0.8}px ${scheme.glow.replace('0.9','0.35')})`,
        }}>
          <IconComp size={iconSize} strokeWidth={1.5} />
        </div>
      </div>

      {/* L9: Inner border */}
      <div className="absolute inset-0" style={{
        boxShadow: `inset 0 0 0 ${Math.max(1, size * 0.02)}px ${scheme.rim}, inset 0 0 ${size * 0.12}px ${scheme.glow.replace('0.9','0.16')}`,
      }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LiquidMineralBadge({
  badge,
  size = 120,
  locked = false,
  showLabel = false,
  onClick,
  className = '',
}) {
  const scheme = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const rarityConf = RARITY_CFG[badge.rarity] || RARITY_CFG.common;
  const IconComp = ICON_MAP[badge.icon] || Gem;
  const iconSize = Math.round(size * 0.29);
  const totalSize = size + rarityConf.rings * 20;
  const offset = rarityConf.rings * 10;

  return (
    <div
      className={cn('relative flex flex-col items-center select-none', className)}
      style={{ width: totalSize, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <style>{`
        @keyframes lmb-glow    { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes lmb-breathe { 0%,100%{filter:brightness(1) saturate(1)} 50%{filter:brightness(1.12) saturate(1.18)} }
        @keyframes lmb-ring    { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.75;transform:scale(1.05)} }
        @keyframes lmb-particle{ 0%{transform:translate(0,0) scale(1);opacity:.55} 50%{transform:translate(var(--px),var(--py)) scale(1.5);opacity:.9} 100%{transform:translate(calc(var(--px)*-0.5),calc(var(--py)*0.8)) scale(.7);opacity:.3} }
      `}</style>

      {/* Outer glow rings */}
      {Array.from({ length: rarityConf.rings }).map((_, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          inset: -(i + 1) * 10 + offset,
          clipPath: OCT,
          background: `radial-gradient(ellipse at center, ${scheme.glow.replace('0.9', String(0.12 - i * 0.03))} 0%, transparent 70%)`,
          animation: `lmb-ring ${2.8 + i}s ${i * 0.5}s ease-in-out infinite`,
        }} />
      ))}

      {/* Badge body */}
      <div
        style={{
          animation: locked ? 'none' : 'lmb-breathe 4s ease-in-out infinite',
          filter: locked ? 'grayscale(0.85) brightness(0.4)' : `drop-shadow(0 0 ${rarityConf.glowBlur}px ${scheme.glow})`,
          transition: 'filter 0.5s ease',
          position: 'relative',
        }}
      >
        <BadgeBody scheme={scheme} mat={badge.material} size={size} IconComp={IconComp} iconSize={iconSize} />

        {/* Lock icon */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ clipPath: OCT }}>
            <Lock size={iconSize * 0.65} className="text-white/25" />
          </div>
        )}
      </div>

      {/* Ambient particles */}
      {!locked && rarityConf.particles > 0 && (
        <div className="absolute pointer-events-none" style={{ inset: -offset, width: totalSize, height: totalSize }}>
          {Array.from({ length: rarityConf.particles }).map((_, i) => {
            const angle = (i / rarityConf.particles) * Math.PI * 2;
            const r = 0.48 + (i % 3) * 0.06;
            const cx = 50 + Math.cos(angle) * r * 50;
            const cy = 50 + Math.sin(angle) * r * 50;
            const ps = 1.5 + (i % 4) * 0.8;
            const delay = (i / rarityConf.particles) * 3.5;
            const dur = 2.8 + (i % 5) * 0.6;
            const pxVal = `${(Math.cos(angle + 0.8) * 4).toFixed(1)}px`;
            const pyVal = `${(Math.sin(angle + 0.8) * 4).toFixed(1)}px`;
            const color = i % 3 === 0 ? scheme.secondary : i % 3 === 1 ? scheme.glow : scheme.crystal;
            return (
              <div key={i} className="absolute rounded-full" style={{
                left: `${cx}%`, top: `${cy}%`,
                width: ps, height: ps,
                background: color,
                boxShadow: `0 0 ${ps * 3}px ${color}`,
                '--px': pxVal, '--py': pyVal,
                animation: `lmb-particle ${dur}s ${delay}s ease-in-out infinite`,
              }} />
            );
          })}
        </div>
      )}

      {/* Label */}
      {showLabel && (
        <div className="mt-2 text-center font-semibold" style={{
          color: locked ? 'hsla(0,0%,100%,0.22)' : scheme.secondary,
          fontSize: Math.max(9, size * 0.1),
          maxWidth: totalSize,
          lineHeight: 1.2,
        }}>
          {badge.title}
        </div>
      )}
    </div>
  );
}