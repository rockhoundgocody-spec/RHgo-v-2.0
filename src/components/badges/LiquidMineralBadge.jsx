/**
 * LiquidMineralBadge — Photorealistic octagonal mineral badge
 *
 * Exact visual spec from reference image:
 * - Large octagonal medallion, beveled dark gunmetal + gold trim edges
 * - Photorealistic crystal cluster emerging from cracked stone base
 * - 9-layer CSS rendering: base → stone cracks → subsurface liquid →
 *   crystal caustics → metallic bevel → specular shine → rim light →
 *   icon glow → inner border filigree
 * - Per-rarity glow rings + ambient golden dust particles
 * - Text plate option: title in serif-style + subtitle
 */
import React from 'react';
import { cn } from '@/lib/utils';
import {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock, Star,
} from 'lucide-react';

const ICON_MAP = {
  Gem, Eye, Package, Layers, Footprints, CheckCircle2, BookOpen,
  Library, Sparkles, GitBranch, Map, Hexagon, Globe, MapPin,
  Mountain, Target, Crown, Zap, Share2, Lock, Star,
};

// ── Color Schemes (12 total — matching reference gem palette) ─────────────────
export const COLOR_SCHEMES = {
  amethyst: {
    primary:   'hsl(270,80%,60%)',  secondary:  'hsl(280,100%,80%)',
    glow:      'hsla(280,100%,72%,0.92)', crystal: 'hsla(268,90%,88%,0.75)',
    dark:      'hsl(255,65%,11%)',  mid:        'hsl(264,55%,24%)',
    rim:       'hsla(278,75%,82%,0.65)', metal:   'hsl(255,20%,30%)',
    goldTrim:  'hsla(45,85%,58%,0.80)', stone:   'hsla(265,35%,16%,0.85)',
  },
  gold: {
    primary:   'hsl(42,100%,52%)',  secondary:  'hsl(48,100%,70%)',
    glow:      'hsla(45,100%,62%,0.92)', crystal: 'hsla(50,90%,82%,0.75)',
    dark:      'hsl(28,65%,9%)',    mid:        'hsl(36,52%,22%)',
    rim:       'hsla(48,82%,72%,0.65)', metal:   'hsl(35,25%,28%)',
    goldTrim:  'hsla(50,100%,65%,0.85)', stone:  'hsla(30,40%,12%,0.85)',
  },
  emerald: {
    primary:   'hsl(150,80%,38%)',  secondary:  'hsl(160,90%,56%)',
    glow:      'hsla(155,88%,52%,0.88)', crystal: 'hsla(152,82%,76%,0.70)',
    dark:      'hsl(143,62%,7%)',   mid:        'hsl(148,52%,18%)',
    rim:       'hsla(162,72%,66%,0.58)', metal:  'hsl(150,20%,25%)',
    goldTrim:  'hsla(45,80%,58%,0.75)', stone:  'hsla(145,40%,10%,0.85)',
  },
  teal: {
    primary:   'hsl(183,90%,40%)',  secondary:  'hsl(190,100%,60%)',
    glow:      'hsla(188,100%,55%,0.88)', crystal: 'hsla(186,90%,78%,0.70)',
    dark:      'hsl(193,62%,7%)',   mid:        'hsl(188,52%,20%)',
    rim:       'hsla(190,82%,68%,0.58)', metal:  'hsl(185,22%,24%)',
    goldTrim:  'hsla(45,80%,58%,0.75)', stone:  'hsla(190,40%,10%,0.85)',
  },
  violet: {
    primary:   'hsl(255,82%,55%)',  secondary:  'hsl(265,92%,74%)',
    glow:      'hsla(260,100%,68%,0.92)', crystal: 'hsla(258,86%,84%,0.72)',
    dark:      'hsl(248,66%,10%)',  mid:        'hsl(252,55%,26%)',
    rim:       'hsla(265,72%,78%,0.62)', metal:  'hsl(250,22%,28%)',
    goldTrim:  'hsla(45,85%,58%,0.80)', stone:  'hsla(252,40%,12%,0.85)',
  },
  amber: {
    primary:   'hsl(30,100%,52%)',  secondary:  'hsl(40,100%,66%)',
    glow:      'hsla(35,100%,60%,0.92)', crystal: 'hsla(38,92%,78%,0.70)',
    dark:      'hsl(22,66%,9%)',    mid:        'hsl(28,55%,20%)',
    rim:       'hsla(42,82%,68%,0.58)', metal:  'hsl(30,22%,26%)',
    goldTrim:  'hsla(50,100%,65%,0.85)', stone: 'hsla(28,40%,10%,0.85)',
  },
  ruby: {
    primary:   'hsl(352,82%,48%)',  secondary:  'hsl(6,92%,66%)',
    glow:      'hsla(0,92%,60%,0.90)', crystal: 'hsla(356,82%,78%,0.70)',
    dark:      'hsl(348,66%,9%)',   mid:        'hsl(350,55%,20%)',
    rim:       'hsla(6,72%,68%,0.58)', metal:  'hsl(348,22%,25%)',
    goldTrim:  'hsla(45,85%,58%,0.80)', stone: 'hsla(350,38%,10%,0.85)',
  },
  cyan: {
    primary:   'hsl(193,100%,44%)', secondary:  'hsl(200,100%,62%)',
    glow:      'hsla(196,100%,55%,0.90)', crystal: 'hsla(194,92%,78%,0.70)',
    dark:      'hsl(203,66%,7%)',   mid:        'hsl(198,55%,18%)',
    rim:       'hsla(200,82%,68%,0.58)', metal:  'hsl(195,22%,24%)',
    goldTrim:  'hsla(45,80%,58%,0.75)', stone:  'hsla(198,40%,9%,0.85)',
  },
  copper: {
    primary:   'hsl(18,72%,48%)',   secondary:  'hsl(26,86%,62%)',
    glow:      'hsla(22,80%,55%,0.88)', crystal: 'hsla(20,76%,72%,0.68)',
    dark:      'hsl(13,62%,9%)',    mid:        'hsl(16,52%,20%)',
    rim:       'hsla(28,74%,62%,0.55)', metal:  'hsl(18,24%,24%)',
    goldTrim:  'hsla(45,80%,58%,0.75)', stone:  'hsla(16,38%,10%,0.85)',
  },
  slate: {
    primary:   'hsl(220,32%,50%)',  secondary:  'hsl(215,42%,68%)',
    glow:      'hsla(218,42%,60%,0.82)', crystal: 'hsla(220,36%,78%,0.62)',
    dark:      'hsl(225,38%,9%)',   mid:        'hsl(222,30%,20%)',
    rim:       'hsla(215,38%,65%,0.52)', metal:  'hsl(220,18%,28%)',
    goldTrim:  'hsla(45,75%,55%,0.70)', stone:  'hsla(222,28%,11%,0.85)',
  },
  jade: {
    primary:   'hsl(160,66%,38%)',  secondary:  'hsl(168,82%,52%)',
    glow:      'hsla(164,76%,48%,0.88)', crystal: 'hsla(162,72%,72%,0.65)',
    dark:      'hsl(156,62%,7%)',   mid:        'hsl(158,52%,16%)',
    rim:       'hsla(168,70%,62%,0.55)', metal:  'hsl(160,20%,22%)',
    goldTrim:  'hsla(45,80%,58%,0.75)', stone:  'hsla(158,38%,9%,0.85)',
  },
  ocean: {
    primary:   'hsl(208,82%,45%)',  secondary:  'hsl(216,92%,62%)',
    glow:      'hsla(212,92%,55%,0.90)', crystal: 'hsla(210,84%,76%,0.68)',
    dark:      'hsl(216,66%,7%)',   mid:        'hsl(212,56%,18%)',
    rim:       'hsla(218,80%,66%,0.58)', metal:  'hsl(210,24%,22%)',
    goldTrim:  'hsla(45,80%,58%,0.75)', stone:  'hsla(212,40%,9%,0.85)',
  },
};

// ── Material texture patterns ─────────────────────────────────────────────────
export const MATERIAL_DEFS = {
  liquid_glass:   { label: 'Liquid Glass',    desc: 'Refractive subsurface flow with internal caustics.' },
  natural_stone:  { label: 'Natural Stone',   desc: 'Layered mineral strata with micro-grain texture.' },
  metallic_inlay: { label: 'Metallic Inlay',  desc: 'Hammered metal filigree with mirror polish.' },
  crystal_core:   { label: 'Crystal Core',    desc: 'Faceted inner gem with optical birefringence.' },
  geo_topo:       { label: 'Geo Topo Lines',  desc: 'Topographic contour mapping etched into surface.' },
};

// ── Rarity config ──────────────────────────────────────────────────────────────
const RARITY_CFG = {
  common:    { rings: 0, particles: 4,  glowBlur: 8,  outerRingOpacity: 0    },
  uncommon:  { rings: 1, particles: 8,  glowBlur: 14, outerRingOpacity: 0.35 },
  rare:      { rings: 1, particles: 13, glowBlur: 20, outerRingOpacity: 0.55 },
  epic:      { rings: 2, particles: 18, glowBlur: 28, outerRingOpacity: 0.70 },
  legendary: { rings: 2, particles: 24, glowBlur: 38, outerRingOpacity: 0.85 },
};

// Octagon clip-path (8-sided)
const OCT = 'polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)';

// ── Material texture overlay (per badge.material) ─────────────────────────────
function getMatOverlay(mat, scheme) {
  switch (mat) {
    case 'natural_stone':
      // Micro-crack lines + granite grain
      return {
        background: [
          `repeating-linear-gradient(38deg, transparent 0px, transparent 4px, hsla(0,0%,100%,0.032) 4px, hsla(0,0%,100%,0.032) 5px)`,
          `repeating-linear-gradient(125deg, transparent 0px, transparent 7px, hsla(0,0%,100%,0.022) 7px, hsla(0,0%,100%,0.022) 8px)`,
          `radial-gradient(ellipse at 30% 60%, ${scheme.stone} 0%, transparent 55%)`,
        ].join(', '),
      };
    case 'metallic_inlay':
      return {
        background: [
          `repeating-linear-gradient(90deg, transparent 0px, transparent 5px, hsla(0,0%,100%,0.06) 5px, hsla(0,0%,100%,0.06) 6px)`,
          `repeating-linear-gradient(0deg, transparent 0px, transparent 5px, hsla(0,0%,100%,0.03) 5px, hsla(0,0%,100%,0.03) 6px)`,
        ].join(', '),
      };
    case 'crystal_core':
      return {
        background: [
          `repeating-conic-gradient(hsla(0,0%,100%,0.055) 0deg, transparent 20deg, hsla(0,0%,100%,0.09) 40deg, transparent 60deg)`,
          `radial-gradient(ellipse at 55% 45%, ${scheme.crystal} 0%, transparent 52%)`,
        ].join(', '),
      };
    case 'geo_topo':
      return {
        background: [
          `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 7px, hsla(200,100%,78%,0.055) 7px, hsla(200,100%,78%,0.055) 8px)`,
          `repeating-radial-gradient(circle at 30% 70%, transparent 0px, transparent 11px, hsla(200,100%,78%,0.03) 11px, hsla(200,100%,78%,0.03) 12px)`,
        ].join(', '),
      };
    default: // liquid_glass
      return {
        background: [
          `radial-gradient(ellipse at 32% 22%, hsla(0,0%,100%,0.26) 0%, transparent 48%)`,
          `radial-gradient(ellipse at 72% 78%, ${scheme.primary.replace(')', ',0.14)')} 0%, transparent 42%)`,
          `radial-gradient(ellipse at 55% 55%, ${scheme.crystal} 0%, transparent 35%)`,
        ].join(', '),
      };
  }
}

// ── Crystal caustics effect (light scatter inside the gem) ────────────────────
function CrystalCaustics({ scheme, size }) {
  const c = size;
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={c} height={c}
      viewBox={`0 0 ${c} ${c}`}
      style={{ mixBlendMode: 'screen', opacity: 0.28 }}
    >
      {/* Internal crystal facet planes */}
      <polygon
        points={`${c*0.5},${c*0.12} ${c*0.78},${c*0.32} ${c*0.68},${c*0.62} ${c*0.32},${c*0.62} ${c*0.22},${c*0.32}`}
        fill="none"
        stroke={scheme.crystal}
        strokeWidth="0.8"
        opacity="0.6"
      />
      <polygon
        points={`${c*0.5},${c*0.22} ${c*0.70},${c*0.38} ${c*0.62},${c*0.58} ${c*0.38},${c*0.58} ${c*0.30},${c*0.38}`}
        fill="none"
        stroke={scheme.secondary}
        strokeWidth="0.6"
        opacity="0.4"
      />
      {/* Light ray from top-left */}
      <line
        x1={c*0.2} y1={c*0.15}
        x2={c*0.55} y2={c*0.5}
        stroke={scheme.crystal}
        strokeWidth="0.7"
        opacity="0.35"
      />
      <line
        x1={c*0.25} y1={c*0.12}
        x2={c*0.6} y2={c*0.46}
        stroke="white"
        strokeWidth="0.4"
        opacity="0.2"
      />
    </svg>
  );
}

// ── Bevel / octagon border with gunmetal + gold trim ─────────────────────────
function OctBevel({ size, scheme, locked }) {
  // We render this as an absolutely-positioned outer ring
  // Using multiple layered box outlines via SVG polygon
  const s = size;
  const pct = 29;
  // Octagon points at size s
  const pts = [
    [pct/100*s, 0], [s - pct/100*s, 0],
    [s, pct/100*s], [s, s - pct/100*s],
    [s - pct/100*s, s], [pct/100*s, s],
    [0, s - pct/100*s], [0, pct/100*s],
  ].map(([x,y]) => `${x},${y}`).join(' ');

  if (locked) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={s} height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{ overflow: 'visible' }}
    >
      {/* Outer gunmetal ring */}
      <polygon
        points={pts}
        fill="none"
        stroke="hsl(220,15%,22%)"
        strokeWidth="3.5"
      />
      {/* Inner gold trim */}
      <polygon
        points={pts}
        fill="none"
        stroke={scheme.goldTrim}
        strokeWidth="1.4"
        opacity="0.85"
      />
      {/* Subtle inner glow stroke */}
      <polygon
        points={pts}
        fill="none"
        stroke={scheme.rim}
        strokeWidth="0.7"
        opacity="0.5"
        style={{ filter: `blur(1px)` }}
      />
    </svg>
  );
}

// ── Stone crack overlay (natural_stone material) ─────────────────────────────
function StoneCracks({ size, scheme }) {
  const s = size;
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={s} height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{ opacity: 0.18, mixBlendMode: 'overlay' }}
    >
      {/* Irregular micro-crack lines */}
      <path d={`M ${s*0.38},${s*0.88} L ${s*0.42},${s*0.72} L ${s*0.48},${s*0.65} L ${s*0.44},${s*0.52}`}
        stroke="white" strokeWidth="0.6" fill="none" opacity="0.7"/>
      <path d={`M ${s*0.62},${s*0.82} L ${s*0.58},${s*0.70} L ${s*0.55},${s*0.58}`}
        stroke="white" strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d={`M ${s*0.22},${s*0.55} L ${s*0.35},${s*0.58} L ${s*0.44},${s*0.52}`}
        stroke="white" strokeWidth="0.4" fill="none" opacity="0.4"/>
      {/* Highlight the cracks */}
      <path d={`M ${s*0.38},${s*0.88} L ${s*0.42},${s*0.72} L ${s*0.48},${s*0.65} L ${s*0.44},${s*0.52}`}
        stroke={scheme.goldTrim} strokeWidth="0.3" fill="none" opacity="0.4"/>
    </svg>
  );
}

// ── Main Badge Body (9 layers) ────────────────────────────────────────────────
function BadgeBody({ scheme, mat, size, IconComp, iconSize, locked }) {
  const matStyle = getMatOverlay(mat, scheme);
  const isStone  = mat === 'natural_stone';

  return (
    <div
      className="relative overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, clipPath: OCT }}
    >
      {/* ── L1: Deep dark stone base ── */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 42% 38%, ${scheme.mid} 0%, ${scheme.dark} 80%)`,
      }} />

      {/* ── L2: Stone / material texture ── */}
      <div className="absolute inset-0" style={{ ...matStyle, opacity: isStone ? 0.35 : 0.24 }} />

      {/* ── L2b: Stone crack SVG ── */}
      {isStone && <StoneCracks size={size} scheme={scheme} />}

      {/* ── L3: Subsurface liquid / lava flow ── */}
      <div className="absolute inset-0" style={{
        background: [
          `radial-gradient(ellipse at 22% 78%, ${scheme.primary.replace(')', ',0.40)')} 0%, transparent 52%)`,
          `radial-gradient(ellipse at 80% 20%, ${scheme.secondary.replace(')', ',0.28)')} 0%, transparent 46%)`,
          `radial-gradient(ellipse at 50% 50%, ${scheme.mid.replace(')', ',0.15)')} 0%, transparent 60%)`,
        ].join(', '),
      }} />

      {/* ── L4: Crystal core caustic glow ── */}
      <div className="absolute" style={{
        inset: '20%',
        background: `radial-gradient(ellipse at 42% 38%, ${scheme.crystal} 0%, transparent 68%)`,
        animation: 'lmb-core 3.2s ease-in-out infinite',
      }} />

      {/* ── L4b: Crystal facet lines (SVG caustics) ── */}
      <CrystalCaustics scheme={scheme} size={size} />

      {/* ── L5: Specular top-left highlight (rim light angle) ── */}
      <div className="absolute" style={{
        top: 0, left: 0, right: 0, height: '48%',
        background: 'linear-gradient(165deg, hsla(0,0%,100%,0.24) 0%, hsla(0,0%,100%,0.06) 55%, transparent 100%)',
      }} />

      {/* ── L6: Bottom rim catch-light (warm gold) ── */}
      <div className="absolute" style={{
        bottom: 0, left: '10%', right: '10%', height: '32%',
        background: `linear-gradient(0deg, ${scheme.rim.replace('0.65','0.50')} 0%, transparent 100%)`,
        filter: 'blur(5px)',
      }} />

      {/* ── L7: Side specular diagonal ── */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(138deg, hsla(0,0%,100%,0.11) 0%, transparent 42%, transparent 58%, hsla(0,0%,0%,0.18) 100%)`,
      }} />

      {/* ── L8: Icon with multi-layer glow ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
        <div style={{
          color: scheme.secondary,
          filter: [
            `drop-shadow(0 0 ${iconSize * 0.5}px ${scheme.glow})`,
            `drop-shadow(0 0 ${iconSize * 1.1}px ${scheme.glow.replace('0.92','0.28')})`,
            `drop-shadow(0 ${iconSize * 0.08}px ${iconSize * 0.55}px ${scheme.dark})`,
          ].join(' '),
          animation: 'lmb-icon 4s ease-in-out infinite',
        }}>
          <IconComp size={iconSize} strokeWidth={1.4} />
        </div>
      </div>

      {/* ── L9: Metallic inner border filigree ── */}
      <div className="absolute inset-0" style={{
        boxShadow: [
          `inset 0 0 0 ${Math.max(1, size * 0.022)}px ${scheme.goldTrim}`,
          `inset 0 0 ${size * 0.08}px ${scheme.glow.replace('0.92','0.10')}`,
          `inset 0 0 ${size * 0.18}px hsla(0,0%,0%,0.35)`,
        ].join(', '),
      }} />

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center" style={{
          background: 'hsla(250,50%,5%,0.62)',
          backdropFilter: 'blur(1px)',
        }}>
          <Lock size={iconSize * 0.6} color="rgba(255,255,255,0.22)" />
        </div>
      )}
    </div>
  );
}

// ── Main exported component ────────────────────────────────────────────────────
export default function LiquidMineralBadge({
  badge,
  size       = 120,
  locked     = false,
  showLabel  = false,
  showPlate  = false,   // show full text plate below badge (title + subtitle)
  subtitle   = null,    // override subtitle text
  onClick,
  className  = '',
}) {
  const scheme    = COLOR_SCHEMES[badge?.colorScheme] || COLOR_SCHEMES.amethyst;
  const rarityCfg = RARITY_CFG[badge?.rarity] || RARITY_CFG.common;
  const IconComp  = ICON_MAP[badge?.icon] || Gem;
  const iconSize  = Math.round(size * 0.30);
  const ringPad   = rarityCfg.rings * 20;
  const totalSize = size + ringPad;
  const ringOffset = ringPad / 2;

  return (
    <div
      className={cn('relative flex flex-col items-center select-none', className)}
      style={{ width: totalSize, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <style>{`
        @keyframes lmb-core  { 0%,100%{opacity:.55;transform:scale(1)}   50%{opacity:.95;transform:scale(1.07)} }
        @keyframes lmb-icon  { 0%,100%{filter:brightness(1)}             50%{filter:brightness(1.18)} }
        @keyframes lmb-breath{ 0%,100%{filter:brightness(1) saturate(1)} 50%{filter:brightness(1.09) saturate(1.14)} }
        @keyframes lmb-ring  { 0%,100%{opacity:.28;transform:scale(1)}   50%{opacity:.72;transform:scale(1.06)} }
        @keyframes lmb-ring2 { 0%,100%{opacity:.18;transform:scale(1)}   50%{opacity:.55;transform:scale(1.1)} }
        @keyframes lmb-dust  {
          0%   { transform:translate(0,0) scale(1);   opacity:.5  }
          50%  { transform:translate(var(--dx),var(--dy)) scale(1.6); opacity:.95 }
          100% { transform:translate(calc(var(--dx)*-.6),calc(var(--dy)*.7)) scale(.6); opacity:.2  }
        }
      `}</style>

      {/* ── Outer glow rings (rarity-based) ── */}
      {Array.from({ length: rarityCfg.rings }).map((_, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          left: ringOffset - (i + 1) * 10,
          top:  ringOffset - (i + 1) * 10,
          width:  size + (i + 1) * 20,
          height: size + (i + 1) * 20,
          clipPath: OCT,
          background: `radial-gradient(ellipse at center, ${scheme.glow.replace('0.92', String(0.11 - i * 0.03))} 0%, transparent 72%)`,
          animation: `${i === 0 ? 'lmb-ring' : 'lmb-ring2'} ${3.2 + i * 0.8}s ${i * 0.6}s ease-in-out infinite`,
        }} />
      ))}

      {/* ── Badge body with bevel ── */}
      <div
        className="relative"
        style={{
          marginLeft: ringOffset, marginTop: ringOffset,
          animation: locked ? 'none' : 'lmb-breath 4.5s ease-in-out infinite',
          filter: locked
            ? 'grayscale(0.9) brightness(0.35)'
            : `drop-shadow(0 0 ${rarityCfg.glowBlur}px ${scheme.glow}) drop-shadow(0 ${size*0.04}px ${size*0.12}px ${scheme.dark})`,
          transition: 'filter 0.6s ease',
          willChange: 'filter',
        }}
      >
        <BadgeBody
          scheme={scheme}
          mat={badge?.material || 'liquid_glass'}
          size={size}
          IconComp={IconComp}
          iconSize={iconSize}
          locked={locked}
        />
        {/* SVG bevel trim overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <OctBevel size={size} scheme={scheme} locked={locked} />
        </div>
      </div>

      {/* ── Ambient dust particles ── */}
      {!locked && rarityCfg.particles > 0 && (
        <div className="absolute pointer-events-none" style={{ inset: 0, width: totalSize, height: totalSize }}>
          {Array.from({ length: rarityCfg.particles }).map((_, i) => {
            const angle = (i / rarityCfg.particles) * Math.PI * 2 + (i % 2) * 0.4;
            const r     = 0.42 + (i % 4) * 0.055;
            const cx    = 50 + Math.cos(angle) * r * 50;
            const cy    = 50 + Math.sin(angle) * r * 50;
            const ps    = 1.4 + (i % 5) * 0.7;
            const delay = (i / rarityCfg.particles) * 4.0;
            const dur   = 2.5 + (i % 6) * 0.55;
            // Golden dust + scheme color mix
            const dustColor = i % 4 === 0
              ? scheme.goldTrim.replace('0.80','0.95')
              : i % 4 === 1 ? scheme.secondary
              : i % 4 === 2 ? scheme.glow
              : scheme.crystal;
            const dx = `${(Math.cos(angle + 1.1) * 5).toFixed(1)}px`;
            const dy = `${(Math.sin(angle + 1.1) * 5).toFixed(1)}px`;
            return (
              <div key={i} className="absolute rounded-full" style={{
                left: `${cx}%`, top: `${cy}%`,
                width: ps, height: ps,
                background: dustColor,
                boxShadow: `0 0 ${ps * 3.5}px ${dustColor}`,
                '--dx': dx, '--dy': dy,
                animation: `lmb-dust ${dur}s ${delay}s ease-in-out infinite`,
              }} />
            );
          })}
        </div>
      )}

      {/* ── Simple title label ── */}
      {showLabel && !showPlate && (
        <div className="mt-2 text-center font-semibold" style={{
          color: locked ? 'hsla(0,0%,100%,0.20)' : scheme.secondary,
          fontSize: Math.max(9, size * 0.10),
          maxWidth: totalSize,
          lineHeight: 1.2,
          textShadow: locked ? 'none' : `0 0 10px ${scheme.glow.replace('0.92','0.5')}`,
        }}>
          {badge?.title}
        </div>
      )}

      {/* ── Full text plate (reference image style) ── */}
      {showPlate && (
        <div className="mt-3 flex flex-col items-center text-center" style={{ maxWidth: totalSize + 24 }}>
          {/* Diamond icon divider */}
          <div style={{ color: scheme.goldTrim, fontSize: 10, marginBottom: 2 }}>◆</div>
          {/* Title */}
          <div style={{
            color: locked ? 'hsla(0,0%,100%,0.22)' : scheme.secondary,
            fontSize: Math.max(10, size * 0.105),
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1.2,
            textShadow: locked ? 'none' : `0 0 12px ${scheme.glow.replace('0.92','0.55')}`,
          }}>
            {badge?.title}
          </div>
          {/* Subtitle */}
          <div style={{
            color: locked ? 'hsla(0,0%,100%,0.15)' : 'hsla(0,0%,100%,0.45)',
            fontSize: Math.max(8, size * 0.082),
            marginTop: 3,
            lineHeight: 1.3,
            letterSpacing: '0.04em',
          }}>
            {subtitle || badge?.description?.slice(0, 40) || ''}
          </div>
        </div>
      )}
    </div>
  );
}