/**
 * BadgeUnlockAnimation — 5-phase cinematic badge unlock
 *
 * Phase 1 — Initiate:  Dark void, unpowered stone, gathering dust motes
 * Phase 2 — Charge:    Purple energy veins build, rings contract inward
 * Phase 3 — Burst:     Crystal explosion + golden particle scatter + white flash
 * Phase 4 — Reveal:    Badge materialises with full glow + text sweeps in
 * Phase 5 — Complete:  Soft ambient chime visual + particles settle, share UI & material breakdown
 */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Share2, Copy, Check, Sparkles, Volume2 } from 'lucide-react';
import LiquidMineralBadge, { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';
import BadgeMaterialPanel from './BadgeMaterialPanel.jsx';
import AmethystParticleField from './AmethystParticleField.jsx';
import StarField from './StarField.jsx';
import LiquidOrbGlow from './LiquidOrbGlow.jsx';

const PHASES  = ['initiate', 'charge', 'burst', 'reveal', 'complete'];
const PHASE_LABELS = {
  initiate: '1. Initiate',
  charge:   '2. Charge',
  burst:    '3. Burst',
  reveal:   '4. Reveal',
  complete: '5. Complete',
};

const TIMINGS = { initiate: 1000, charge: 1200, burst: 700, reveal: 1400, complete: Infinity };

const RARITY_LABEL = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic',
};

// ── Dust motes (Phase 1) ──────────────────────────────────────────────────────
function DustMotes({ color }) {
  const motes = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      size: 1 + Math.random() * 2.5,
      dur: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    })), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full" style={{ width: 320, height: 320 }}>
      {motes.map((m, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`, top: `${m.y}%`,
            width: m.size, height: m.size,
            background: color,
            boxShadow: `0 0 ${m.size * 4}px ${color}`,
          }}
          animate={{ y: [-6, 6, -6], opacity: [0.1, 0.65, 0.1] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Energy rings (Phase 2) ────────────────────────────────────────────────────
function ChargeRings({ scheme }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width:  280 - i * 48, height: 280 - i * 48,
            border: `${2.5 - i * 0.4}px solid ${scheme.glow.replace('0.9', String(0.55 - i * 0.1))}`,
            boxShadow: `0 0 ${22 - i * 4}px ${scheme.glow.replace('0.9','0.4')}, inset 0 0 ${12 - i*2}px ${scheme.glow.replace('0.9','0.12')}`,
          }}
          initial={{ scale: 2.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.0, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 230, height: 230,
          background: `conic-gradient(from 0deg, transparent 0%, ${scheme.glow.replace('0.9','0.45')} 25%, transparent 50%, ${scheme.glow.replace('0.9','0.3')} 75%, transparent 100%)`,
          filter: 'blur(10px)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle, hsla(0,0%,100%,0.6) 0%, ${scheme.crystal} 20%, ${scheme.glow.replace('0.9','0.7')} 50%, transparent 75%)`,
          filter: `blur(2px)`,
        }}
        initial={{ width: 12, height: 12, opacity: 0.3 }}
        animate={{ width: 72, height: 72, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </>
  );
}

// ── Crystal explosion burst (Phase 3) ─────────────────────────────────────────
function CrystalBurst({ scheme }) {
  const shards = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const dist  = 120 + Math.random() * 80;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 3 + Math.random() * 6,
        rot: Math.random() * 360,
      };
    }), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Central flash */}
      <motion.div
        className="absolute rounded-full"
        style={{ background: 'hsla(0,0%,100%,0.95)', filter: 'blur(12px)' }}
        initial={{ width: 10, height: 10, opacity: 1 }}
        animate={{ width: 380, height: 380, opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
      {/* Shards flying outward */}
      {shards.map((s, i) => (
        <motion.div key={i}
          className="absolute"
          style={{
            width: s.size, height: s.size * 2,
            background: i % 2 === 0 ? scheme.secondary : 'hsla(48,100%,75%,0.9)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            boxShadow: `0 0 10px ${scheme.glow}`,
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{ x: s.x, y: s.y, scale: 0, opacity: 0, rotate: s.rot }}
          transition={{ duration: 0.65, ease: [0.0, 0.9, 0.2, 1] }}
        />
      ))}
    </div>
  );
}

// ── Settling particles + Chime ripple (Phase 5) ──────────────────────────────
function SettlingParticles({ scheme }) {
  const particles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      x: (Math.random() - 0.5) * 240,
      startY: (Math.random() - 0.5) * 120 - 40,
      endY: (Math.random() - 0.5) * 120 + 40,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 1.5,
      dur: 3 + Math.random() * 2,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Soft chime ripple */}
      <motion.div
        className="absolute rounded-full border border-purple-400/30"
        initial={{ width: 100, height: 100, opacity: 0.8 }}
        animate={{ width: 360, height: 360, opacity: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
      />
      {/* Settling golden particles */}
      {particles.map((p, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            background: i % 3 === 0 ? '#ffe066' : scheme.secondary,
            boxShadow: `0 0 6px ${scheme.glow}`,
          }}
          initial={{ x: p.x, y: p.startY, opacity: 0 }}
          animate={{ y: [p.startY, p.endY], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Share Row ─────────────────────────────────────────────────────────────────
function ShareRow({ badge }) {
  const [copied, setCopied] = useState(false);
  const text = `🏆 I earned the "${badge.title}" badge on RockHound-GO! https://rhgo.base44.app`;

  const share = async () => {
    const { executeShare } = await import('@/lib/shareAchievement');
    await executeShare({ title: badge.title, text, url: 'https://rhgo.base44.app' });
  };

  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex gap-2">
      <button onClick={share}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(195,80%,14%,0.7)', border: '1px solid hsla(195,80%,55%,0.35)', color: 'hsl(195,100%,82%)' }}>
        <Share2 size={12} /> Share
      </button>
      <button onClick={copy}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(265,60%,14%,0.7)', border: '1px solid hsla(280,60%,55%,0.35)', color: 'hsl(280,100%,88%)' }}>
        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
      </button>
    </div>
  );
}

// ── Main Overlay ──────────────────────────────────────────────────────────────
export default function BadgeUnlockAnimation({ badge, onClose }) {
  const [phase, setPhase]                 = useState('initiate');
  const [showMaterials, setShowMaterials] = useState(false);
  const timers = useRef([]);
  const prefersReducedMotion = useReducedMotion();

  const jumpToPhase = (targetPhase) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase(prefersReducedMotion ? 'complete' : targetPhase);
  };

  useEffect(() => {
    if (!badge) return;
    setPhase(prefersReducedMotion ? 'complete' : 'initiate');
    setShowMaterials(false);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (prefersReducedMotion) return undefined;

    let elapsed = TIMINGS.initiate;
    PHASES.slice(1).forEach((p) => {
      if (TIMINGS[p] === Infinity) return;
      timers.current.push(setTimeout(() => setPhase(p), elapsed));
      elapsed += TIMINGS[p];
    });
    timers.current.push(setTimeout(() => setPhase('complete'), elapsed));

    return () => timers.current.forEach(clearTimeout);
  }, [badge, prefersReducedMotion]);

  if (!badge) return null;

  const scheme    = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const completed = phase === 'complete';
  const showBadge = phase === 'reveal' || phase === 'complete';
  const showBurst = phase === 'burst';

  return (
    <AnimatePresence>
      <motion.div
        key="unlock-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-unlock-title"
        className="fixed inset-0 z-[9000] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, hsla(260,90%,4%,0.96) 0%, hsla(250,80%,2%,0.98) 100%)',
          backdropFilter: 'blur(12px)',
        }}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <StarField seed={badge.code || badge.title} />

        {/* Phase selector scrubber bar */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
          {PHASES.map((p) => (
            <button
              key={p}
              onClick={() => jumpToPhase(p)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 motion-reduce:transition-none ${
                phase === p
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {PHASE_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Close button */}
        <motion.button onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white/80 transition z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 motion-reduce:transition-none"
          style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.12)' }}
          aria-label="Close unlock animation"
        >
          <X size={18} />
        </motion.button>

        {/* ── Centre Stage ── */}
        <div className="relative flex items-center justify-center mt-8" style={{ width: 320, height: 320 }}>

          {/* Phase 1: Initiate — dark unpowered stone medallion */}
          {phase === 'initiate' && (
            <div className="relative flex items-center justify-center">
              <motion.div className="absolute rounded-full"
                style={{ background: `radial-gradient(circle, ${scheme.glow.replace('0.9','0.07')} 0%, transparent 70%)` }}
                initial={{ width: 60, height: 60, opacity: 0 }}
                animate={{ width: 320, height: 320, opacity: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
              <DustMotes color={scheme.secondary} />
              <div className="opacity-40 filter grayscale">
                <LiquidMineralBadge badge={badge} size={150} locked={true} />
              </div>
            </div>
          )}

          {/* Phase 2: Charge */}
          {phase === 'charge' && <ChargeRings scheme={scheme} />}

          {/* Phase 3: Burst — crystal explosion + particle bloom */}
          {showBurst && (
            <>
              <CrystalBurst scheme={scheme} />
              {!prefersReducedMotion && <AmethystParticleField intensity={1.5} size={320} />}
            </>
          )}

          {/* Phase 4 + 5: Badge + particle aura */}
          {showBadge && !prefersReducedMotion && <AmethystParticleField intensity={1} size={300} />}
          <AnimatePresence>
            {showBadge && (
              <motion.div
                key="badge-reveal"
                className="relative flex flex-col items-center"
                initial={prefersReducedMotion ? false : { scale: 0.25, opacity: 0, rotateY: -90, filter: 'brightness(3)' }}
                animate={{ scale: 1, opacity: 1, rotateY: 0, filter: 'brightness(1)' }}
                transition={{ duration: 1.1, ease: [0.12, 1, 0.28, 1] }}
              >
                <LiquidOrbGlow size={210} color={scheme.glow} reduceMotion={prefersReducedMotion} />
                <motion.div
                  className="relative"
                  animate={completed && !prefersReducedMotion ? { y: [0, -10, 0], filter: ['brightness(1)', 'brightness(1.08)', 'brightness(1)'] } : {}}
                  transition={completed && !prefersReducedMotion ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  <LiquidMineralBadge badge={badge} size={172} locked={false} arGlow={completed} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settling particles + chime visual indicator on complete */}
          {completed && !prefersReducedMotion && (
            <>
              <SettlingParticles scheme={scheme} />
              <AmethystParticleField intensity={1.2} size={360} />
            </>
          )}
        </div>

        {/* ── Text: Reveal → Complete ── */}
        <AnimatePresence>
          {showBadge && (
            <motion.div
              className="flex flex-col items-center text-center px-8 mt-2"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-[10px] uppercase tracking-[0.5em] mb-2 flex items-center gap-2"
                style={{ color: scheme.secondary }}>
                {completed ? <Volume2 size={12} className="animate-pulse motion-reduce:animate-none" /> : <Sparkles size={10} />}
                {completed ? 'Unlock Complete · Soft Chime' : 'Badge Unlocked'}
                <Sparkles size={10} />
              </div>
              <h2 id="badge-unlock-title" className="text-white text-[26px] font-black tracking-wide mb-1.5 leading-tight"
                style={{ textShadow: `0 0 24px ${scheme.glow}, 0 0 48px ${scheme.glow.replace('0.9','0.3')}` }}>
                {badge.title}
              </h2>
              <p className="text-white/55 text-sm max-w-[280px] leading-relaxed">{badge.description}</p>
              <div className="text-[9px] uppercase tracking-[0.35em] mt-3 px-4 py-1.5 rounded-full"
                style={{
                  background: `${scheme.primary.replace(')', ',0.16)')}`,
                  border: `1px solid ${scheme.rim}`,
                  color: scheme.secondary,
                  boxShadow: `0 0 12px ${scheme.glow.replace('0.9','0.2')}`,
                }}>
                ✦ {RARITY_LABEL[badge.rarity] || badge.rarity} ✦
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Complete actions ── */}
        {completed && (
          <motion.div
            className="flex flex-col items-center gap-3 mt-4 w-full px-8"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ShareRow badge={badge} />

            <button onClick={() => setShowMaterials(v => !v)}
              className="text-[10px] uppercase tracking-wider text-white/28 hover:text-white/60 transition">
              {showMaterials ? '▲ Hide' : '▼ View'} Material Breakdown
            </button>

            <AnimatePresence>
              {showMaterials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-sm overflow-hidden"
                >
                  <BadgeMaterialPanel badge={badge} />
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={onClose}
              className="mt-1 px-12 py-3.5 rounded-full text-sm font-black tracking-widest transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
                color: 'hsl(255,60%,10%)',
                boxShadow: `0 0 28px ${scheme.glow.replace('0.9','0.55')}, 0 4px 16px hsla(255,60%,5%,0.4)`,
              }}>
              CONTINUE →
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}