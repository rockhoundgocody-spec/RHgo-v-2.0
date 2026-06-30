/**
 * LiquidMineralBadge — Photorealistic 3D octagonal badge renderer
 *
 * Layering (bottom → top):
 *   L1  Deep stone base
 *   L2  Subsurface mineral veins
 *   L3  Material texture pattern
 *   L4  Liquid subsurface flow  (radial gradients)
 *   L5  Crystal core caustics   (inner gem glow)
 *   L6  Stone micro-crack overlay
 *   L7  Metallic inlay filigree
 *   L8  Top specular highlight
 *   L9  Bottom rim catch-light
 *   L10 Side rim specular
 *   L11 Icon (glowing, drop-shadow)
 *   L12 Inner border + inset glow
 */
import React from 'react';
import { cn } from '@/lib/utils';
import {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock, Diamond, Star,
} from 'lucide-react';

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICON_MAP = {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock, Diamond, Star,
};

// ── Color Schemes ─────────────────────────────────────────────────────────────
export const COLOR_SCHEMES = {
  amethyst: {
    primary:   'hsl(270,80%,60%)',  secondary: 'hsl(280,100%,75%)',
    glow:      'hsla(280,100%,70%,0.9)',  crystal: 'hsla(270,90%,85%,0.7)',
    dark:      'hsl(255,60%,12%)', mid:    'hsl(265,52%,28%)', rim: 'hsla(280,70%,80%,0.6)',
    vein:      'hsla(275,70%,55%,0.25)',
  },
  gold: {
    primary:   'hsl(42,100%,50%)',  secondary: 'hsl(48,100%,68%)',
    glow:      'hsla(45,100%,60%,0.9)',  crystal: 'hsla(50,90%,80%,0.7)',
    dark:      'hsl(30,60%,9%)',   mid:    'hsl(38,52%,22%)', rim: 'hsla(48,80%,70%,0.6)',
    vein:      'hsla(42,80%,50%,0.2)',
  },
  emerald: {
    primary:   'hsl(152,80%,38%)', secondary: 'hsl(162,90%,55%)',
    glow:      'hsla(155,90%,50%,0.85)', crystal: 'hsla(152,80%,75%,0.65)',
    dark:      'hsl(145,60%,7%)',  mid:    'hsl(148,52%,18%)', rim: 'hsla(162,70%,65%,0.55)',
    vein:      'hsla(150,70%,40%,0.2)',
  },
  teal: {
    primary:   'hsl(185,90%,40%)', secondary: 'hsl(192,100%,60%)',
    glow:      'hsla(190,100%,55%,0.85)', crystal: 'hsla(188,90%,78%,0.65)',
    dark:      'hsl(195,60%,7%)',  mid:    'hsl(190,52%,20%)', rim: 'hsla(192,80%,68%,0.55)',
    vein:      'hsla(188,80%,45%,0.18)',
  },
  violet: {
    primary:   'hsl(255,80%,55%)', secondary: 'hsl(265,90%,72%)',
    glow:      'hsla(260,100%,68%,0.9)', crystal: 'hsla(258,85%,82%,0.68)',
    dark:      'hsl(248,65%,11%)', mid:    'hsl(252,55%,26%)', rim: 'hsla(265,70%,78%,0.6)',
    vein:      'hsla(260,75%,55%,0.22)',
  },
  amber: {
    primary:   'hsl(32,100%,50%)', secondary: 'hsl(40,100%,65%)',
    glow:      'hsla(36,100%,58%,0.9)', crystal: 'hsla(38,90%,78%,0.65)',
    dark:      'hsl(25,65%,9%)',   mid:    'hsl(30,55%,20%)', rim: 'hsla(42,80%,68%,0.55)',
    vein:      'hsla(35,80%,48%,0.2)',
  },
  ruby: {
    primary:   'hsl(355,80%,48%)', secondary: 'hsl(5,90%,65%)',
    glow:      'hsla(0,90%,58%,0.88)', crystal: 'hsla(358,80%,78%,0.65)',
    dark:      'hsl(350,65%,9%)',  mid:    'hsl(352,55%,20%)', rim: 'hsla(5,70%,68%,0.55)',
    vein:      'hsla(0,75%,45%,0.22)',
  },
  cyan: {
    primary:   'hsl(195,100%,45%)', secondary: 'hsl(200,100%,62%)',
    glow:      'hsla(197,100%,55%,0.88)', crystal: 'hsla(196,90%,78%,0.65)',
    dark:      'hsl(205,65%,7%)',  mid:    'hsl(200,55%,18%)', rim: 'hsla(200,80%,68%,0.55)',
    vein:      'hsla(197,85%,45%,0.18)',
  },
  copper: {
    primary:   'hsl(20,70%,48%)',  secondary: 'hsl(28,85%,62%)',
    glow:      'hsla(24,80%,55%,0.85)', crystal: 'hsla(22,75%,72%,0.65)',
    dark:      'hsl(15,60%,9%)',   mid:    'hsl(18,52%,20%)', rim: 'hsla(28,72%,62%,0.55)',
    vein:      'hsla(22,65%,42%,0.18)',
  },
  slate: {
    primary:   'hsl(220,30%,50%)', secondary: 'hsl(215,40%,68%)',
    glow:      'hsla(218,40%,60%,0.8)', crystal: 'hsla(220,35%,78%,0.6)',
    dark:      'hsl(225,35%,9%)',  mid:    'hsl(222,30%,20%)', rim: 'hsla(215,38%,65%,0.5)',
    vein:      'hsla(218,35%,45%,0.15)',
  },
  jade: {
    primary:   'hsl(162,65%,38%)', secondary: 'hsl(168,80%,52%)',
    glow:      'hsla(165,75%,48%,0.85)', crystal: 'hsla(163,70%,72%,0.62)',
    dark:      'hsl(158,60%,7%)',  mid:    'hsl(160,52%,16%)', rim: 'hsla(168,68%,62%,0.52)',
    vein:      'hsla(163,60%,38%,0.18)',
  },
  ocean: {
    primary:   'hsl(210,80%,45%)', secondary: 'hsl(218,90%,62%)',
    glow:      'hsla(214,90%,55%,0.88)', crystal: 'hsla(212,82%,76%,0.65)',
    dark:      'hsl(218,65%,7%)',  mid:    'hsl(214,55%,18%)', rim: 'hsla(218,78%,66%,0.55)',
    vein:      'hsla(213,75%,45%,0.2)',
  },
};

// ── Material overlays ─────────────────────────────────────────────────────────
export const MATERIAL_DEFS = {
  liquid_glass:   { label: 'Liquid Glass',    desc: 'Refractive subsurface flow with internal caustics and micro-bubble refraction.' },
  natural_stone:  { label: 'Natural Stone',   desc: 'Layered mineral strata with micro-grain texture and natural crack patterns.' },
  metallic_inlay: { label: 'Metallic Inlay',  desc: 'Hammered metal filigree with gold plating and mirror-polished bevels.' },
  crystal_core:   { label: 'Crystal Core',    desc: 'Faceted inner gem with optical birefringence and colour dispersion.' },
  geo_topo:       { label: 'Geo Topo Lines',  desc: 'Topographic contour mapping precision-etched into the badge surface.' },
};

// ── Rarity config ─────────────────────────────────────────────────────────────
const RARITY_CFG = {
  common:    { rings: 0, particles: 3,  glowBlur: 8  },
  uncommon:  { rings: 1, particles: 6,  glowBlur: 14 },
  rare:      { rings: 1, particles: 10, glowBlur: 20 },
  epic:      { rings: 2, particles: 14, glowBlur: 28 },
  legendary: { rings: 2, particles: 22, glowBlur: 38 },
};

// Material texture patterns (CSS gradients)
const matPattern = (mat, scheme) => ({
  liquid_glass: `
    radial-gradient(ellipse at 32% 22%, hsla(0,0%,100%,0.26) 0%, transparent 50%),
    radial-gradient(ellipse at 72% 78%, ${scheme.primary.replace(')', ',0.13)')} 0%, transparent 42%),
    radial-gradient(ellipse at 55% 50%, ${scheme.crystal} 0%, transparent 60%)
  `,
  natural_stone: `
    repeating-linear-gradient(47deg, transparent 0px, transparent 3px, hsla(0,0%,100%,0.04) 3px, hsla(0,0%,100%,0.04) 4px),
    repeating-linear-gradient(133deg, transparent 0px, transparent 6px, hsla(0,0%,0%,0.04) 6px, hsla(0,0%,0%,0.04) 7px)
  `,
  metallic_inlay: `
    repeating-linear-gradient(90deg, transparent 0px, transparent 5px, hsla(0,0%,100%,0.07) 5px, hsla(0,0%,100%,0.07) 6px),
    repeating-linear-gradient(0deg, transparent 0px, transparent 5px, hsla(0,0%,0%,0.04) 5px, hsla(0,0%,0%,0.04) 6px)
  `,
  crystal_core: `
    repeating-conic-gradient(from 15deg, hsla(0,0%,100%,0.07) 0deg, transparent 30deg, hsla(0,0%,100%,0.12) 60deg, transparent 90deg),
    radial-gradient(ellipse at 50% 40%, hsla(0,0%,100%,0.12) 0%, transparent 55%)
  `,
  geo_topo: `
    repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 8px, hsla(200,100%,80%,0.07) 8px, hsla(200,100%,80%,0.07) 9px),
    repeating-linear-gradient(25deg, transparent 0px, transparent 12px, ${scheme.secondary.replace(')', ',0.04)')} 12px, ${scheme.secondary.replace(')', ',0.04)')} 13px)
  `,
})[mat] || '';

// Stone crack SVG overlay
const CrackOverlay = ({ size }) => (
  <svg
    className="absolute inset-0 pointer-events-none"
    width={size} height={size}
    viewBox="0 0 100 100"
    style={{ opacity: 0.06, mixBlendMode: 'overlay' }}
  >
    <polyline points="18,45 25,38 34,52 42,44 55,60" stroke="white" strokeWidth="0.6" fill="none" strokeLinecap="round" />
    <polyline points="65,20 72,30 68,42 78,38" stroke="white" strokeWidth="0.4" fill="none" strokeLinecap="round" />
    <polyline points="30,68 38,72 42,80 50,75 58,82" stroke="white" strokeWidth="0.5" fill="none" strokeLinecap="round" />
    <polyline points="75,60 80,68 72,74" stroke="white" strokeWidth="0.35" fill="none" strokeLinecap="round" />
  </svg>
);

// Metallic filigree SVG
const FiligreeOverlay = ({ size, color }) => (
  <svg
    className="absolute inset-0 pointer-events-none"
    width={size} height={size}
    viewBox="0 0 100 100"
    style={{ opacity: 0.18 }}
  >
    {/* Corner accent diamonds */}
    <polygon points="15,15 19,12 23,15 19,18" fill={color} opacity="0.7" />
    <polygon points="77,15 81,12 85,15 81,18" fill={color} opacity="0.7" />
    <polygon points="15,82 19,79 23,82 19,85" fill={color} opacity="0.7" />
    <polygon points="77,82 81,79 85,82 81,85" fill={color} opacity="0.7" />
    {/* Central cross micro-accent */}
    <line x1="50" y1="22" x2="50" y2="28" stroke={color} strokeWidth="0.8" opacity="0.5" />
    <line x1="44" y1="25" x2="56" y2="25" stroke={color} strokeWidth="0.8" opacity="0.5" />
  </svg>
);

// Octagon clip path
const OCT = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

// ── Badge Body (all visual layers) ────────────────────────────────────────────
function BadgeBody({ scheme, mat, size, IconComp, iconSize }) {
  const matPat = matPattern(mat, scheme);

  return (
    <div
      className="relative overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, clipPath: OCT }}
    >
      {/* L1: Deep stone base */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 38% 32%, ${scheme.mid} 0%, ${scheme.dark} 80%)`,
      }} />

      {/* L2: Mineral veins */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 20% 80%, ${scheme.vein} 0%, transparent 40%),
          radial-gradient(ellipse at 80% 20%, ${scheme.vein} 0%, transparent 40%),
          radial-gradient(ellipse at 60% 60%, ${scheme.vein} 0%, transparent 30%)
        `,
      }} />

      {/* L3: Material texture */}
      {matPat && (
        <div className="absolute inset-0" style={{ background: matPat, opacity: 0.28 }} />
      )}

      {/* L4: Liquid subsurface flow */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 22% 70%, ${scheme.primary.replace(')', ',0.38)')} 0%, transparent 52%),
          radial-gradient(ellipse at 80% 25%, ${scheme.secondary.replace(')', ',0.28)')} 0%, transparent 48%)
        `,
      }} />

      {/* L5: Crystal core caustics */}
      <div
        className="absolute"
        style={{
          inset: '20%',
          background: `radial-gradient(ellipse at 42% 38%, ${scheme.crystal} 0%, ${scheme.glow.replace('0.9','0.45')} 35%, transparent 65%)`,
          animation: 'lmb-glow 3.5s ease-in-out infinite',
        }}
      />

      {/* L6: Stone micro-cracks */}
      <CrackOverlay size={size} />

      {/* L7: Metallic filigree */}
      <FiligreeOverlay size={size} color={scheme.secondary} />

      {/* L8: Top specular highlight */}
      <div className="absolute" style={{
        top: 0, left: 0, right: 0, height: '42%',
        background: 'linear-gradient(180deg, hsla(0,0%,100%,0.20) 0%, hsla(0,0%,100%,0.04) 60%, transparent 100%)',
      }} />

      {/* L9: Bottom rim catch-light */}
      <div className="absolute" style={{
        bottom: 0, left: '10%', right: '10%', height: '26%',
        background: `linear-gradient(0deg, ${scheme.rim} 0%, transparent 100%)`,
        filter: 'blur(5px)',
      }} />

      {/* L10: Side rim specular */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, hsla(0,0%,100%,0.12) 0%, transparent 38%, transparent 62%, hsla(0,0%,0%,0.18) 100%)`,
      }} />

      {/* L11: Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div style={{
          color: scheme.secondary,
          filter: `
            drop-shadow(0 0 ${iconSize * 0.45}px ${scheme.glow})
            drop-shadow(0 2px ${iconSize * 0.9}px ${scheme.glow.replace('0.9','0.4')})
            drop-shadow(0 0 2px hsla(0,0%,100%,0.5))
          `,
        }}>
          <IconComp size={iconSize} strokeWidth={1.4} />
        </div>
      </div>

      {/* L12: Inner border + inset glow */}
      <div className="absolute inset-0" style={{
        boxShadow: `
          inset 0 0 0 ${Math.max(1, size * 0.022)}px ${scheme.rim},
          inset 0 0 ${size * 0.14}px ${scheme.glow.replace('0.9','0.18')},
          inset 0 ${size * 0.02}px ${size * 0.08}px hsla(0,0%,100%,0.08)
        `,
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
  const scheme      = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const rarityConf  = RARITY_CFG[badge.rarity] || RARITY_CFG.common;
  const IconComp    = ICON_MAP[badge.icon] || Gem;
  const iconSize    = Math.round(size * 0.30);
  const totalSize   = size + rarityConf.rings * 22;
  const offset      = rarityConf.rings * 11;

  return (
    <div
      className={cn('relative flex flex-col items-center select-none', className)}
      style={{ width: totalSize, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <style>{`
        @keyframes lmb-glow     { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes lmb-breathe  { 0%,100%{filter:brightness(1) saturate(1)} 50%{filter:brightness(1.14) saturate(1.22)} }
        @keyframes lmb-ring     { 0%,100%{opacity:.32;transform:scale(1)} 50%{opacity:.78;transform:scale(1.06)} }
        @keyframes lmb-particle { 0%{transform:translate(0,0) scale(1);opacity:.55} 50%{transform:translate(var(--px),var(--py)) scale(1.6);opacity:.92} 100%{transform:translate(calc(var(--px)*-0.4),calc(var(--py)*0.7)) scale(.6);opacity:.25} }
        @keyframes lmb-spin-ring{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* Outer glow rings */}
      {Array.from({ length: rarityConf.rings }).map((_, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          inset: -(i + 1) * 11 + offset,
          clipPath: OCT,
          background: `radial-gradient(ellipse at center, ${scheme.glow.replace('0.9', String(0.13 - i * 0.035))} 0%, transparent 68%)`,
          animation: `lmb-ring ${2.8 + i * 0.7}s ${i * 0.4}s ease-in-out infinite`,
        }} />
      ))}

      {/* Legendary: spinning outer accent ring */}
      {badge.rarity === 'legendary' && !locked && (
        <div className="absolute pointer-events-none" style={{
          inset: -offset - 4,
          clipPath: OCT,
          border: `1px solid ${scheme.rim.replace('0.6','0.25')}`,
          animation: 'lmb-spin-ring 12s linear infinite',
          borderTopColor: scheme.secondary,
          borderRightColor: 'transparent',
          borderRadius: '4px',
        }} />
      )}

      {/* Badge body */}
      <div style={{
        animation: locked ? 'none' : 'lmb-breathe 4.5s ease-in-out infinite',
        filter: locked
          ? 'grayscale(0.9) brightness(0.35)'
          : `drop-shadow(0 0 ${rarityConf.glowBlur}px ${scheme.glow}) drop-shadow(0 4px 12px hsla(255,60%,5%,0.7))`,
        transition: 'filter 0.5s ease',
        position: 'relative',
      }}>
        <BadgeBody scheme={scheme} mat={badge.material} size={size} IconComp={IconComp} iconSize={iconSize} />

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ clipPath: OCT }}>
            <Lock size={iconSize * 0.6} className="text-white/22" />
          </div>
        )}
      </div>

      {/* Ambient floating particles */}
      {!locked && rarityConf.particles > 0 && (
        <div className="absolute pointer-events-none" style={{ inset: -offset, width: totalSize, height: totalSize }}>
          {Array.from({ length: rarityConf.particles }).map((_, i) => {
            const angle  = (i / rarityConf.particles) * Math.PI * 2;
            const r      = 0.46 + (i % 4) * 0.055;
            const cx     = 50 + Math.cos(angle) * r * 50;
            const cy     = 50 + Math.sin(angle) * r * 50;
            const ps     = 1.4 + (i % 5) * 0.85;
            const delay  = (i / rarityConf.particles) * 3.8;
            const dur    = 2.6 + (i % 6) * 0.55;
            const pxVal  = `${(Math.cos(angle + 0.9) * 4.5).toFixed(1)}px`;
            const pyVal  = `${(Math.sin(angle + 0.9) * 4.5).toFixed(1)}px`;
            // Alternate between primary/secondary/crystal colours
            const color  = i % 4 === 0 ? scheme.secondary
                         : i % 4 === 1 ? scheme.glow
                         : i % 4 === 2 ? scheme.crystal
                         : 'hsla(48,100%,80%,0.7)'; // gold sparkle
            return (
              <div key={i} className="absolute rounded-full" style={{
                left: `${cx}%`, top: `${cy}%`,
                width: ps, height: ps,
                background: color,
                boxShadow: `0 0 ${ps * 3.5}px ${color}`,
                '--px': pxVal, '--py': pyVal,
                animation: `lmb-particle ${dur}s ${delay}s ease-in-out infinite`,
              }} />
            );
          })}
        </div>
      )}

      {showLabel && (
        <div className="mt-2 text-center font-semibold" style={{
          color: locked ? 'hsla(0,0%,100%,0.2)' : scheme.secondary,
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