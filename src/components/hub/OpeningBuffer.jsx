/**
 * OpeningBuffer — cinematic boot/buffer screen.
 *
 * Plays as the very first thing the user sees while the app hydrates
 * (auth, entities, map tiles, model weights). An amethyst crystal "blooms"
 * from a dark geode while a charge bar fills and a cinematic tagline reveals.
 * Auto-advances when `onDone` fires (caller decides readiness), or after a
 * max fallback duration. Tap to skip.
 *
 * Pure CSS/SVG + framer-motion — no video, no heavy deps. Loads instantly.
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TAGLINES = [
  'Calibrating crystal lattice…',
  'Loading bedrock strata…',
  'Waking the field oracle…',
];

const MAX_FALLBACK_MS = 4200; // never trap the user

export default function OpeningBuffer({ onDone }) {
  const [phase, setPhase] = useState('charging'); // charging → bloom → exit
  const [progress, setProgress] = useState(0);
  const [tagIdx, setTagIdx] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  // Drive the charge bar with rAF for smooth, GPU-friendly motion.
  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - startRef.current;
      // Ease toward 100% over ~3s, then hold.
      const p = Math.min(1, elapsed / 3000);
      setProgress(p);
      // Cycle taglines at thresholds.
      const idx = p < 0.34 ? 0 : p < 0.72 ? 1 : 2;
      setTagIdx((prev) => (prev !== idx ? idx : prev));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Charge complete → bloom the crystal → exit.
        setTimeout(() => setPhase('bloom'), 350);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Safety: never trap the user beyond the fallback window.
  useEffect(() => {
    const t = setTimeout(() => setPhase('exit'), MAX_FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  // Bloom → exit transition.
  useEffect(() => {
    if (phase === 'bloom') {
      const t = setTimeout(() => setPhase('exit'), 900);
      return () => clearTimeout(t);
    }
    if (phase === 'exit') {
      const t = setTimeout(onDone, 650);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  const pct = Math.round(progress * 100);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          key="opening-buffer"
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setPhase('exit')}
        >
          {/* ── Deep geode backdrop ── */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 45%, hsl(265 55% 14%) 0%, hsl(250 35% 9%) 45%, hsl(245 30% 5%) 100%)',
            }}
          />
          {/* Ambient amethyst bloom that intensifies as charge rises */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: 0.15 + progress * 0.5 }}
            transition={{ duration: 0.4 }}
            style={{
              background:
                'radial-gradient(circle at 50% 42%, hsla(280,100%,55%,0.5) 0%, transparent 55%)',
            }}
          />
          {/* Slow drifting crystal dust */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 100}%`,
                  background: 'hsl(280 100% 88%)',
                  boxShadow: '0 0 6px hsla(280,100%,75%,0.8)',
                }}
                animate={{
                  y: [0, -18, 0],
                  opacity: [0.1, 0.6, 0.1],
                }}
                transition={{
                  duration: 4 + (i % 4),
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* ── Centerpiece: blooming crystal ── */}
          <div className="relative flex items-center justify-center mb-10">
            {/* Outer pulse ring — expands as charge builds */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 180,
                height: 180,
                border: '1px solid hsla(280,100%,75%,0.25)',
                boxShadow: '0 0 40px hsla(280,100%,55%,0.3) inset',
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Rotating faceted ring */}
            <motion.svg
              width="160"
              height="160"
              viewBox="0 0 160 160"
              className="absolute"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              <polygon
                points="80,12 140,48 140,112 80,148 20,112 20,48"
                fill="none"
                stroke="hsla(280,100%,80%,0.35)"
                strokeWidth="1"
              />
              <polygon
                points="80,28 126,56 126,104 80,132 34,104 34,56"
                fill="none"
                stroke="hsla(195,100%,70%,0.25)"
                strokeWidth="0.75"
              />
            </motion.svg>

            {/* Crystal core — scales up with charge, blooms on completion */}
            <motion.div
              animate={{
                scale: 0.4 + progress * 0.6,
                rotate: phase === 'bloom' ? [0, 8, -4, 0] : 0,
                filter:
                  phase === 'bloom'
                    ? 'brightness(1.6) drop-shadow(0 0 30px hsla(280,100%,75%,0.9))'
                    : `brightness(${0.7 + progress * 0.5}) drop-shadow(0 0 ${10 + progress * 25}px hsla(280,100%,60%,${0.3 + progress * 0.5}))`,
              }}
              transition={{
                duration: phase === 'bloom' ? 0.9 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <CrystalCore />
            </motion.div>
          </div>

          {/* ── Wordmark ── */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          >
            <div className="text-[9px] uppercase tracking-[0.5em] text-white/30 mb-1.5 font-semibold">
              Rockhounding OS
            </div>
            <div
              className="text-3xl font-black text-white"
              style={{
                letterSpacing: '-0.02em',
                textShadow: '0 0 40px hsla(280,100%,75%,0.6), 0 0 80px hsla(265,80%,50%,0.3)',
              }}
            >
              RockHound
              <span style={{ color: 'hsl(280,100%,88%)' }}> GO</span>
            </div>
          </motion.div>

          {/* ── Charge bar + tagline ── */}
          <div className="w-56 flex flex-col items-center gap-2.5">
            <div
              className="w-full h-[3px] rounded-full overflow-hidden"
              style={{ background: 'hsla(270,30%,40%,0.25)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background:
                    'linear-gradient(90deg, hsl(265 80% 55%), hsl(280 100% 80%))',
                  boxShadow: '0 0 12px hsla(280,100%,70%,0.7)',
                }}
              />
            </div>
            <div className="h-4 flex items-center justify-between w-full">
              <AnimatePresence mode="wait">
                <motion.span
                  key={tagIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35 }}
                  className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-mono"
                >
                  {TAGLINES[tagIdx]}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] font-mono text-amethyst-glow/60 tabular-nums">
                {pct}%
              </span>
            </div>
          </div>

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-5 text-white/20 text-[9px] tracking-[0.3em] uppercase"
          >
            Tap to skip
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Faceted amethyst crystal SVG — the centerpiece that blooms. */
function CrystalCore() {
  return (
    <svg width="78" height="96" viewBox="0 0 78 96" fill="none">
      <defs>
        <linearGradient id="rhgo-crystal-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(280 100% 92%)" />
          <stop offset="50%" stopColor="hsl(270 85% 65%)" />
          <stop offset="100%" stopColor="hsl(265 80% 40%)" />
        </linearGradient>
        <linearGradient id="rhgo-crystal-facet" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="hsl(280 100% 80%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(265 70% 45%)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Left facet */}
      <polygon points="39,4 12,34 39,88" fill="url(#rhgo-crystal-facet)" opacity="0.85" />
      {/* Right facet */}
      <polygon points="39,4 66,34 39,88" fill="url(#rhgo-crystal-grad)" opacity="0.95" />
      {/* Center highlight */}
      <polygon points="39,4 39,88 26,40" fill="hsl(280 100% 95%)" opacity="0.25" />
      {/* Edge glints */}
      <line x1="39" y1="4" x2="39" y2="88" stroke="hsl(280 100% 95%)" strokeWidth="0.75" opacity="0.6" />
      <line x1="39" y1="4" x2="12" y2="34" stroke="hsl(280 100% 90%)" strokeWidth="0.5" opacity="0.4" />
      <line x1="39" y1="4" x2="66" y2="34" stroke="hsl(280 100% 90%)" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}