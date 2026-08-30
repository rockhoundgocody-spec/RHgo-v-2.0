/**
 * RareMineralPopup — Amethyst-style popup that fires when a user saves
 * a rare or legendary mineral (and/or earns a new badge at the same time).
 *
 * Designed as a bottom-sheet popup (NOT full-screen) so it layers over the
 * scan result without blocking it. It auto-dismisses after 6s or on tap.
 *
 * Visual language: deep amethyst void, crystal growth lines, pulsing glow rings,
 * floating gem shards, gold sparkle burst on entry.
 */
import React, { useEffect, useRef, useMemo, useState, useId } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown, Gem, X } from 'lucide-react';
import LiquidMineralBadge from '@/components/badges/LiquidMineralBadge.jsx';

const RARITY_CFG = {
  rare: {
    label:    'Rare Find!',
    color:    'hsl(195,100%,68%)',
    glow:     'hsla(195,100%,60%,0.7)',
    bg:       'linear-gradient(145deg, hsla(210,80%,8%,0.97) 0%, hsla(240,60%,6%,0.98) 100%)',
    border:   'hsla(195,100%,60%,0.45)',
    scheme:   'cyan',
    Icon:     Gem,
  },
  legendary: {
    label:    'Legendary Find!!',
    color:    'hsl(45,100%,62%)',
    glow:     'hsla(45,100%,60%,0.8)',
    bg:       'linear-gradient(145deg, hsla(30,80%,6%,0.98) 0%, hsla(255,60%,5%,0.99) 100%)',
    border:   'hsla(45,100%,60%,0.55)',
    scheme:   'gold',
    Icon:     Crown,
  },
};

// Floating crystal shards
function CrystalShards({ color, glow }) {
  const shards = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      x:     10 + Math.random() * 80,
      y:     10 + Math.random() * 80,
      size:  2 + Math.random() * 3.5,
      dur:   2.2 + Math.random() * 2.8,
      delay: Math.random() * 2.5,
      gold:  i % 4 === 0,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {shards.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size * 2.2,
            background: s.gold
              ? 'linear-gradient(180deg, hsl(48,100%,75%), hsl(42,100%,55%))'
              : `linear-gradient(180deg, ${color}, transparent)`,
            boxShadow: `0 0 ${s.size * 3}px ${s.gold ? 'hsla(45,100%,65%,0.8)' : glow}`,
            rotate: `${Math.random() * 360}deg`,
          }}
          animate={{
            y:       [-4, 4, -4],
            opacity: [0.25, 0.85, 0.25],
            rotate:  [`${Math.random() * 360}deg`, `${Math.random() * 360 + 180}deg`],
          }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Burst of gold sparkles on mount
function GoldBurst({ color, glow }) {
  const sparks = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * Math.PI * 2;
      const dist  = 60 + Math.random() * 80;
      return { angle, dist, delay: i * 0.018, gold: i % 3 === 0 };
    }), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-3xl">
      {sparks.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: s.gold ? 4 : 2.5,
            height: s.gold ? 4 : 2.5,
            background: s.gold ? 'hsl(48,100%,78%)' : color,
            boxShadow: `0 0 6px ${s.gold ? 'hsl(48,100%,65%)' : glow}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(s.angle) * s.dist,
            y: Math.sin(s.angle) * s.dist,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.65, delay: s.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export default function RareMineralPopup({
  rarity,        // 'rare' | 'legendary'
  mineralName,   // string
  badge,         // badge def if a new badge was just earned, else null
  onClose,
  autoDismissMs = 6000,
}) {
  const cfg = RARITY_CFG[rarity] || RARITY_CFG.rare;
  const [showBurst, setShowBurst] = useState(true);
  const timerRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    // Hide the burst after it completes
    const t = setTimeout(() => setShowBurst(false), 800);
    // Auto dismiss
    timerRef.current = setTimeout(onClose, autoDismissMs);
    return () => { clearTimeout(t); clearTimeout(timerRef.current); };
  }, [onClose, autoDismissMs]);

  const badgeToShow = badge ? {
    colorScheme: badge.colorScheme || (rarity === 'legendary' ? 'gold' : 'cyan'),
    material: badge.material || 'crystal_core',
    ...badge,
  } : null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed bottom-24 left-3 right-3 z-[8000] rounded-3xl overflow-hidden"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 40px ${cfg.glow}, 0 12px 48px hsla(255,80%,5%,0.6), inset 0 1px 0 hsla(0,0%,100%,0.08)`,
      }}
      initial={{ y: 120, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
    >
      {/* Ambient pulsing glow rings */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-3xl"
            style={{ border: `1px solid ${cfg.border.replace('0.45', String(0.2 - i * 0.08))}` }}
            animate={{ scale: [1, 1.04 + i * 0.03, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2 + i * 0.6, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Crystal veins — subtle diagonal lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{ opacity: 0.06 }}>
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <line x1="0" y1="40%" x2="100%" y2="60%" stroke="white" strokeWidth="0.8" />
          <line x1="15%" y1="0" x2="85%" y2="100%" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="70%" x2="60%" y2="0" stroke="white" strokeWidth="0.4" />
        </svg>
      </div>

      {/* Top specular shine */}
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, hsla(0,0%,100%,0.07) 0%, transparent 100%)' }} />

      <CrystalShards color={cfg.color} glow={cfg.glow} />
      {showBurst && <GoldBurst color={cfg.color} glow={cfg.glow} />}

      {/* Content */}
      <div className="relative p-4 flex items-center gap-4">
        {/* Left: Badge or rarity icon */}
        <div className="flex-shrink-0">
          {badgeToShow ? (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 14, stiffness: 220 }}
            >
              <LiquidMineralBadge badge={badgeToShow} size={64} locked={false} />
            </motion.div>
          ) : (
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${cfg.glow.replace('0.7','0.3')} 0%, transparent 70%)`,
                border: `1px solid ${cfg.border}`,
                boxShadow: `0 0 20px ${cfg.glow}`,
              }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 12 }}
            >
              <cfg.Icon size={30} style={{ color: cfg.color, filter: `drop-shadow(0 0 8px ${cfg.glow})` }} />
            </motion.div>
          )}
        </div>

        {/* Right: Text */}
        <div className="flex-1 min-w-0">
          <motion.div
            id={descId}
            className="text-[9px] font-black uppercase tracking-[0.35em] mb-0.5 flex items-center gap-1.5"
            style={{ color: cfg.color }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={9} aria-hidden="true" />
            {cfg.label}
          </motion.div>

          <motion.div
            id={titleId}
            className="text-white font-black text-base leading-tight truncate"
            style={{ textShadow: `0 0 16px ${cfg.glow}` }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
          >
            {mineralName}
          </motion.div>

          {badgeToShow && (
            <motion.div
              className="text-[10px] mt-0.5 font-semibold"
              style={{ color: `${cfg.color}cc` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              🏆 {badgeToShow.title} badge unlocked
            </motion.div>
          )}

          {/* Progress bar (auto-dismiss countdown) */}
          <motion.div
            className="mt-2 h-0.5 rounded-full overflow-hidden"
            style={{ background: `${cfg.color}22` }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.glow}` }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
            />
          </motion.div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
          style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsla(0,0%,100%,0.45)' }}
          aria-label="Dismiss rare mineral popup"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
