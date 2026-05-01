import React from 'react';
import {
  Gem,
  Layers,
  Library,
  Sparkles,
  Crown,
  Hexagon,
  MapPin,
  CheckCircle2,
  Lock,
  Award,
  Star,
  Mountain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Explicit icon registry — keeps Lucide tree-shakable.
// Add new entries here when introducing new badges.
const ICONS = {
  Gem,
  Layers,
  Library,
  Sparkles,
  Crown,
  Hexagon,
  MapPin,
  CheckCircle2,
  Award,
  Star,
  Mountain,
};

// Frame + core gradients tinted by rarity tier.
// Spec: gunmetal → green alloy → cobalt → violet chrome → liquid gold.
const RARITY = {
  common: {
    frame: 'linear-gradient(135deg, #4a4d52 0%, #1c1e22 50%, #5a5d63 100%)',
    rim: 'hsla(220, 8%, 70%, 0.6)',
    core: 'radial-gradient(circle at 35% 30%, hsla(0,0%,90%,0.35) 0%, hsla(220,15%,40%,0.5) 35%, hsla(230,25%,8%,0.95) 75%)',
    glow: 'hsla(220, 12%, 70%, 0.35)',
    aura: 'hsla(220, 10%, 60%, 0.18)',
    iconColor: 'hsl(220 15% 90%)',
  },
  uncommon: {
    frame: 'linear-gradient(135deg, #2d5a3a 0%, #0f1f15 50%, #4a8c5e 100%)',
    rim: 'hsla(140, 60%, 65%, 0.7)',
    core: 'radial-gradient(circle at 35% 30%, hsla(140,80%,75%,0.45) 0%, hsla(150,60%,30%,0.6) 35%, hsla(155,80%,8%,0.95) 75%)',
    glow: 'hsla(140, 80%, 55%, 0.45)',
    aura: 'hsla(140, 80%, 50%, 0.22)',
    iconColor: 'hsl(140 80% 85%)',
  },
  rare: {
    frame: 'linear-gradient(135deg, #1d3a78 0%, #0a1530 50%, #3a6cb8 100%)',
    rim: 'hsla(210, 90%, 70%, 0.75)',
    core: 'radial-gradient(circle at 35% 30%, hsla(200,100%,80%,0.5) 0%, hsla(215,80%,35%,0.6) 35%, hsla(220,90%,8%,0.95) 75%)',
    glow: 'hsla(210, 100%, 60%, 0.55)',
    aura: 'hsla(210, 100%, 55%, 0.28)',
    iconColor: 'hsl(200 100% 88%)',
  },
  epic: {
    frame: 'linear-gradient(135deg, #5b2a8c 0%, #1a0830 50%, #b56cff 100%)',
    rim: 'hsla(280, 100%, 75%, 0.85)',
    core: 'radial-gradient(circle at 35% 30%, hsla(290,100%,82%,0.55) 0%, hsla(275,80%,40%,0.65) 35%, hsla(265,90%,10%,0.95) 75%)',
    glow: 'hsla(280, 100%, 65%, 0.65)',
    aura: 'hsla(280, 100%, 60%, 0.35)',
    iconColor: 'hsl(290 100% 90%)',
  },
  legendary: {
    frame: 'linear-gradient(135deg, #c08a1a 0%, #3a2400 45%, #ffe082 100%)',
    rim: 'hsla(45, 100%, 70%, 0.95)',
    core: 'radial-gradient(circle at 35% 30%, hsla(50,100%,85%,0.6) 0%, hsla(38,90%,45%,0.7) 35%, hsla(30,90%,12%,0.95) 75%)',
    glow: 'hsla(45, 100%, 60%, 0.75)',
    aura: 'hsla(40, 100%, 55%, 0.45)',
    iconColor: 'hsl(48 100% 88%)',
  },
};

// Faceted hex polygon — flat-top hexagon
const HEX_CLIP = 'polygon(25% 5%, 75% 5%, 98% 50%, 75% 95%, 25% 95%, 2% 50%)';

export default function LiquidCrystalBadge({
  rarity = 'common',
  icon = 'Gem',
  size = 120,
  locked = false,
  className = '',
  onClick,
}) {
  const tier = RARITY[rarity] || RARITY.common;
  const IconCmp = ICONS[icon] || Gem;
  const lockedStyle = locked ? { filter: 'grayscale(0.85) brightness(0.45)', opacity: 0.55 } : {};

  return (
    <div
      className={cn(
        'relative inline-block transition-transform duration-300',
        onClick && 'cursor-pointer hover:scale-[1.04] active:scale-[0.98]',
        className
      )}
      style={{ width: size, height: size, ...lockedStyle }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {/* Outer aura — pulses for higher rarities */}
      {!locked && (
        <div
          className="absolute rounded-full blur-2xl pointer-events-none animate-badge-aura"
          style={{
            inset: -size * 0.18,
            background: `radial-gradient(circle, ${tier.aura} 0%, transparent 65%)`,
          }}
        />
      )}

      {/* Slow rotation wrapper for the medallion */}
      <div className="relative w-full h-full animate-badge-rotate" style={{ willChange: 'transform' }}>
        {/* Outer frame — brushed metal hex */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: HEX_CLIP,
            background: tier.frame,
            boxShadow: `0 0 ${size * 0.25}px ${tier.glow}`,
          }}
        />
        {/* Brushed metal grain overlay */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            clipPath: HEX_CLIP,
            background:
              'repeating-linear-gradient(135deg, hsla(0,0%,100%,0.08) 0px, hsla(0,0%,100%,0.08) 1px, transparent 1px, transparent 3px)',
          }}
        />
        {/* Rim highlight */}
        <div
          className="absolute inset-[3%] pointer-events-none"
          style={{
            clipPath: HEX_CLIP,
            background: `linear-gradient(135deg, ${tier.rim} 0%, transparent 30%, transparent 70%, ${tier.rim} 100%)`,
            opacity: 0.6,
            mixBlendMode: 'screen',
          }}
        />

        {/* Inner concave core — liquid crystal */}
        <div
          className="absolute"
          style={{
            inset: '14%',
            clipPath: HEX_CLIP,
            background: tier.core,
            boxShadow: `inset 0 0 ${size * 0.15}px hsla(0,0%,0%,0.7), inset 0 0 ${size * 0.08}px ${tier.glow}`,
          }}
        />

        {/* Inner caustic shimmer — slow drift */}
        {!locked && (
          <div
            className="absolute pointer-events-none animate-badge-caustic mix-blend-screen"
            style={{
              inset: '14%',
              clipPath: HEX_CLIP,
              background: `radial-gradient(ellipse 60% 40% at 30% 25%, ${tier.glow} 0%, transparent 55%), radial-gradient(ellipse 40% 30% at 70% 75%, ${tier.glow} 0%, transparent 60%)`,
              opacity: 0.7,
            }}
          />
        )}

        {/* Specular highlight */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '14%',
            clipPath: HEX_CLIP,
            background:
              'radial-gradient(ellipse 50% 25% at 35% 18%, hsla(0,0%,100%,0.45) 0%, transparent 60%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Icon at core */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <IconCmp
            size={size * 0.32}
            style={{
              color: tier.iconColor,
              filter: locked ? 'none' : `drop-shadow(0 0 ${size * 0.08}px ${tier.glow})`,
            }}
          />
        </div>

        {/* Locked padlock overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Lock size={size * 0.28} className="text-white/70" />
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes badge-rotate {
          0%, 100% { transform: rotate(-1deg); }
          50%      { transform: rotate(1deg); }
        }
        @keyframes badge-aura {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes badge-caustic {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33%      { transform: translate(2%, -1%) rotate(2deg); }
          66%      { transform: translate(-1%, 2%) rotate(-2deg); }
        }
        .animate-badge-rotate  { animation: badge-rotate 8s ease-in-out infinite; }
        .animate-badge-aura    { animation: badge-aura 3.5s ease-in-out infinite; }
        .animate-badge-caustic { animation: badge-caustic 9s ease-in-out infinite; }
      `}</style>
    </div>
  );
}