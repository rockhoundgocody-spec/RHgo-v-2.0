/**
 * LiquidMineralBadge — Photorealistic 3D octagonal badge renderer
 *
 * Layering (bottom → top):
 *   L1  Deep stone base (Dark obsidian or Light quartzite/marble)
 *   L2  Subsurface mineral veins
 *   L3  Material texture pattern (Liquid Glass, Natural Stone, Metallic Inlay, Crystal Core, Geo Topo)
 *   L4  Liquid subsurface flow  (radial gradients)
 *   L5  Crystal core caustics   (inner gem glow)
 *   L6  Stone micro-crack overlay
 *   L7  Brushed metallic inlay filigree with gold plating
 *   L8  Top specular highlight & light refraction
 *   L9  Bottom rim catch-light
 *   L10 Side rim specular
 *   L11 Icon (glowing, drop-shadow)
 *   L12 Inner border + inset glow
 */
import React, { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import './liquidMineralBadge.css';
import {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock, Diamond, Star,
  Sprout, Trophy, Route, Atom, Leaf, Shield, PenLine, FlaskConical,
  CalendarCheck,
} from 'lucide-react';

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICON_MAP = {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock, Diamond, Star,
  Sprout, Trophy, Route, Atom, Leaf, Shield, PenLine, FlaskConical,
  CalendarCheck,
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
  // Mythic — obsidian base with liquid fire veins
  mythic: {
    primary:   'hsl(20,100%,50%)',  secondary: 'hsl(35,100%,60%)',
    glow:      'hsla(25,100%,55%,0.95)', crystal: 'hsla(30,100%,70%,0.7)',
    dark:      'hsl(0,0%,4%)',       mid:    'hsl(15,40%,12%)', rim: 'hsla(25,90%,60%,0.65)',
    vein:      'hsla(20,100%,50%,0.35)',
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
  mythic:    { rings: 3, particles: 28, glowBlur: 46 },
};

// Material texture patterns (CSS gradients)
const matPattern = (mat, scheme, isLight) => ({
  liquid_glass: `
    radial-gradient(ellipse at 32% 22%, ${isLight ? 'hsla(0,0%,100%,0.5)' : 'hsla(0,0%,100%,0.26)'} 0%, transparent 50%),
    radial-gradient(ellipse at 72% 78%, ${scheme.primary.replace(')', ',0.18)')} 0%, transparent 42%),
    radial-gradient(ellipse at 55% 50%, ${scheme.crystal} 0%, transparent 60%)
  `,
  natural_stone: `
    repeating-linear-gradient(47deg, transparent 0px, transparent 3px, ${isLight ? 'hsla(0,0%,0%,0.05)' : 'hsla(0,0%,100%,0.04)'} 3px, ${isLight ? 'hsla(0,0%,0%,0.05)' : 'hsla(0,0%,100%,0.04)'} 4px),
    repeating-linear-gradient(133deg, transparent 0px, transparent 6px, hsla(0,0%,0%,0.06) 6px, hsla(0,0%,0%,0.06) 7px)
  `,
  metallic_inlay: `
    repeating-linear-gradient(90deg, transparent 0px, transparent 5px, ${isLight ? 'hsla(45,100%,40%,0.12)' : 'hsla(0,0%,100%,0.07)'} 5px, ${isLight ? 'hsla(45,100%,40%,0.12)' : 'hsla(0,0%,100%,0.07)'} 6px),
    repeating-linear-gradient(0deg, transparent 0px, transparent 5px, hsla(0,0%,0%,0.04) 5px, hsla(0,0%,0%,0.04) 6px)
  `,
  crystal_core: `
    repeating-conic-gradient(from 15deg, ${isLight ? 'hsla(280,100%,50%,0.12)' : 'hsla(0,0%,100%,0.07)'} 0deg, transparent 30deg, ${isLight ? 'hsla(0,0%,100%,0.25)' : 'hsla(0,0%,100%,0.12)'} 60deg, transparent 90deg),
    radial-gradient(ellipse at 50% 40%, hsla(0,0%,100%,0.18) 0%, transparent 55%)
  `,
  geo_topo: `
    repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 8px, ${isLight ? 'hsla(200,100%,40%,0.12)' : 'hsla(200,100%,80%,0.07)'} 8px, ${isLight ? 'hsla(200,100%,40%,0.12)' : 'hsla(200,100%,80%,0.07)'} 9px),
    repeating-linear-gradient(25deg, transparent 0px, transparent 12px, ${scheme.secondary.replace(')', ',0.08)')} 12px, ${scheme.secondary.replace(')', ',0.08)')} 13px)
  `,
})[mat] || '';

// Stone crack SVG overlay
const CrackOverlay = ({ size, isLight }) => (
  <svg
    className="absolute inset-0 pointer-events-none"
    width={size} height={size}
    viewBox="0 0 100 100"
    style={{ opacity: isLight ? 0.12 : 0.06, mixBlendMode: isLight ? 'multiply' : 'overlay' }}
  >
    <polyline points="18,45 25,38 34,52 42,44 55,60" stroke={isLight ? '#1e293b' : 'white'} strokeWidth="0.6" fill="none" strokeLinecap="round" />
    <polyline points="65,20 72,30 68,42 78,38" stroke={isLight ? '#1e293b' : 'white'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
    <polyline points="30,68 38,72 42,80 50,75 58,82" stroke={isLight ? '#1e293b' : 'white'} strokeWidth="0.5" fill="none" strokeLinecap="round" />
    <polyline points="75,60 80,68 72,74" stroke={isLight ? '#1e293b' : 'white'} strokeWidth="0.35" fill="none" strokeLinecap="round" />
  </svg>
);

// Metallic filigree SVG with Gold Plating
const FiligreeOverlay = ({ size, color, isLight }) => (
  <svg
    className="absolute inset-0 pointer-events-none"
    width={size} height={size}
    viewBox="0 0 100 100"
    style={{ opacity: isLight ? 0.35 : 0.22 }}
  >
    {/* Outer octagonal filigree border */}
    <polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.6" />
    {/* Corner accent gold diamonds */}
    <polygon points="15,15 19,12 23,15 19,18" fill="url(#goldGrad)" opacity="0.9" />
    <polygon points="77,15 81,12 85,15 81,18" fill="url(#goldGrad)" opacity="0.9" />
    <polygon points="15,82 19,79 23,82 19,85" fill="url(#goldGrad)" opacity="0.9" />
    <polygon points="77,82 81,79 85,82 81,85" fill="url(#goldGrad)" opacity="0.9" />
    {/* Central cross micro-accent */}
    <line x1="50" y1="22" x2="50" y2="28" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.8" />
    <line x1="44" y1="25" x2="56" y2="25" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.8" />
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffe066" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#aa7c11" />
      </linearGradient>
    </defs>
  </svg>
);

// Octagon clip path
const OCT = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';

// ── Badge Body (all visual layers) ────────────────────────────────────────────
function BadgeBody({ scheme, mat, size, IconComp, iconSize, variant, arGlow, reduceMotion }) {
  const isLight = variant === 'light';

  return (
    <div
      className="relative overflow-hidden flex-shrink-0 transition-all duration-300"
      style={{ width: size, height: size, clipPath: OCT }}
    >
      {/* Liquid Glass Medal base — premium glass for all badges */}
      <img
        src="https://media.base44.com/images/public/69f35dd14650b54681c835ec/5f84cc464_generated_d23e9b3d.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* L2: Mineral veins — subtle color tint over glass */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 20% 80%, ${scheme.vein} 0%, transparent 40%),
          radial-gradient(ellipse at 80% 20%, ${scheme.vein} 0%, transparent 40%),
          radial-gradient(ellipse at 60% 60%, ${scheme.vein} 0%, transparent 30%)
        `,
        opacity: 0.4,
      }} />

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
          animation: reduceMotion
            ? 'none'
            : arGlow
              ? 'lmb-glow 1.5s ease-in-out infinite'
              : 'lmb-glow 3.5s ease-in-out infinite',
        }}
      />

      {/* L7: Metallic filigree */}
      <FiligreeOverlay size={size} color={scheme.secondary} isLight={isLight} />

      {/* L7.5: Light refraction sheen */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, transparent 28%, transparent 72%, hsla(280,80%,90%,0.10) 100%)',
        mixBlendMode: 'screen',
      }} />

      {/* L8: Top specular highlight */}
      <div className="absolute" style={{
        top: 0, left: 0, right: 0, height: '42%',
        background: isLight
          ? 'linear-gradient(180deg, hsla(0,0%,100%,0.45) 0%, hsla(0,0%,100%,0.10) 60%, transparent 100%)'
          : 'linear-gradient(180deg, hsla(0,0%,100%,0.20) 0%, hsla(0,0%,100%,0.04) 60%, transparent 100%)',
      }} />

      {/* L9: Bottom rim catch-light */}
      <div className="absolute" style={{
        bottom: 0, left: '10%', right: '10%', height: '26%',
        background: `linear-gradient(0deg, ${scheme.rim} 0%, transparent 100%)`,
        filter: 'blur(5px)',
      }} />

      {/* L10: Side rim specular */}
      <div className="absolute inset-0" style={{
        background: isLight
          ? `linear-gradient(135deg, hsla(0,0%,100%,0.25) 0%, transparent 38%, transparent 62%, hsla(220,30%,20%,0.15) 100%)`
          : `linear-gradient(135deg, hsla(0,0%,100%,0.12) 0%, transparent 38%, transparent 62%, hsla(0,0%,0%,0.18) 100%)`,
      }} />

      {/* L11: Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div style={{
          color: isLight ? scheme.primary : scheme.secondary,
          filter: `
            drop-shadow(0 0 ${iconSize * 0.45}px ${scheme.glow})
            drop-shadow(0 2px ${iconSize * 0.9}px ${scheme.glow.replace('0.9','0.4')})
            drop-shadow(0 0 2px ${isLight ? 'hsla(0,0%,100%,0.8)' : 'hsla(0,0%,100%,0.5)'})
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
          inset 0 ${size * 0.02}px ${size * 0.08}px ${isLight ? 'hsla(0,0%,100%,0.3)' : 'hsla(0,0%,100%,0.08)'}
        `,
      }} />

      {/* AR Scanning Reticle Overlay */}
      {arGlow && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={cn('w-full h-full border border-cyan-400/50', !reduceMotion && 'animate-pulse')} style={{ clipPath: OCT }} />
          <div className={cn('absolute w-3/4 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80', !reduceMotion && 'animate-bounce')} />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LiquidMineralBadge({
  badge,
  size = 120,
  locked = false,
  showLabel = false,
  variant = 'dark', // 'dark' | 'light'
  arGlow = false,   // hover/AR mode
  onClick = () => {},
  className = '',
}) {
  const reduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered]   = useState(false);

  const scheme      = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const rarityConf  = RARITY_CFG[badge.rarity] || RARITY_CFG.common;
  const IconComp    = ICON_MAP[badge.icon] || Gem;
  const iconSize    = Math.round(size * 0.30);
  const totalSize   = size + rarityConf.rings * 22;
  const offset      = rarityConf.rings * 11;

  const isArActive = arGlow || hovered;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div
      className={cn('relative flex flex-col items-center select-none', !reduceMotion && 'transition-transform duration-300', className)}
      style={{
        width: totalSize,
        cursor: onClick ? 'pointer' : 'default',
        transform: hovered && !locked && !reduceMotion
          ? `perspective(600px) rotateX(${mousePos.y * -18}deg) rotateY(${mousePos.x * 18}deg) scale(1.08)`
          : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMousePos({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
    >
      {/* Outer glow rings */}
      {Array.from({ length: rarityConf.rings }).map((_, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          inset: -(i + 1) * 11 + offset,
          clipPath: OCT,
          background: `radial-gradient(ellipse at center, ${scheme.glow.replace('0.9', String(0.13 - i * 0.035))} 0%, transparent 68%)`,
          animation: reduceMotion ? 'none' : `lmb-ring ${2.8 + i * 0.7}s ${i * 0.4}s ease-in-out infinite`,
        }} />
      ))}

      {/* Legendary: spinning outer accent ring */}
      {badge.rarity === 'legendary' && !locked && (
        <div className="absolute pointer-events-none" style={{
          inset: -offset - 4,
          clipPath: OCT,
          border: `1px solid ${scheme.rim.replace('0.6','0.25')}`,
          animation: reduceMotion ? 'none' : 'lmb-spin-ring 12s linear infinite',
          borderTopColor: scheme.secondary,
          borderRightColor: 'transparent',
          borderRadius: '4px',
        }} />
      )}

      {/* Badge body */}
      <div style={{
        animation: locked || reduceMotion ? 'none' : 'lmb-breathe 4.5s ease-in-out infinite',
        filter: locked
          ? 'grayscale(0.9) brightness(0.35)'
          : isArActive
          ? `drop-shadow(0 0 ${rarityConf.glowBlur * 1.6}px ${scheme.glow}) drop-shadow(0 0 25px ${scheme.secondary})`
          : `drop-shadow(0 0 ${rarityConf.glowBlur}px ${scheme.glow}) drop-shadow(0 4px 12px hsla(255,60%,5%,0.7))`,
        transition: 'filter 0.5s ease',
        position: 'relative',
      }}>
        <BadgeBody
          scheme={scheme}
          mat={badge.material}
          size={size}
          IconComp={IconComp}
          iconSize={iconSize}
          variant={variant}
          arGlow={isArActive}
          reduceMotion={reduceMotion}
        />

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ clipPath: OCT }}>
            <Lock size={iconSize * 0.6} className="text-white/22" />
          </div>
        )}

        {/* Locked crystalline shimmer sweep */}
        {locked && !reduceMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ clipPath: OCT }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(115deg, transparent 35%, hsla(0,0%,100%,0.16) 50%, transparent 65%)',
                animation: 'lmb-shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Ambient floating particles */}
      {!locked && !reduceMotion && rarityConf.particles > 0 && (
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
          color: locked
            ? variant === 'light' ? 'hsla(220,20%,30%,0.35)' : 'hsla(0,0%,100%,0.2)'
            : variant === 'light' ? scheme.primary : scheme.secondary,
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