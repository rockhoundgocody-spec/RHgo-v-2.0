/**
 * BadgeUnlockAnimation — 5-phase cinematic badge unlock
 *
 * Phase 1 — Initiate:  Dark void, gathering dust motes
 * Phase 2 — Charge:    Purple energy veins build, rings contract inward
 * Phase 3 — Burst:     Crystal explosion + golden particle scatter + white flash
 * Phase 4 — Reveal:    Badge materialises with full glow + text sweeps in
 * Phase 5 — Complete:  Soft ambient chime visual + particles settle, share UI
 */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Sparkles } from 'lucide-react';
import LiquidMineralBadge, { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';
import BadgeMaterialPanel from './BadgeMaterialPanel.jsx';

const PHASES  = ['initiate', 'charge', 'burst', 'reveal', 'complete'];
const TIMINGS = { initiate: 900, charge: 1100, burst: 600, reveal: 1200, complete: Infinity };

const RARITY_LABEL = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};

// ── Dust motes (Phase 1) ──────────────────────────────────────────────────────
function DustMotes({ color }) {
  const motes = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      size: 1 + Math.random() * 2,
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
          animate={{ y: [-4, 4, -4], opacity: [0.15, 0.6, 0.15] }}
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
      {/* Contracting rings */}
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
      {/* Rotating conic energy sweep */}
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
      {/* Central gathering orb */}
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
      {/* Vein sparks */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.div key={`spark-${i}`}
            className="absolute"
            style={{
              width: 2, height: 30 + i * 5,
              background: `linear-gradient(180deg, ${scheme.secondary}, transparent)`,
              transformOrigin: 'top center',
              top: '50%', left: '50%',
              rotate: `${(i / 8) * 360}deg`,
              borderRadius: '2px',
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: [0, 0.9, 0.5] }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
          />
        );
      })}
    </>
  );
}

// ── Crystal burst shards (Phase 3) ────────────────────────────────────────────
function CrystalBurst({ scheme }) {
  const shards = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist  = 130 + Math.random() * 100;
      const size  = 2 + Math.random() * 4;
      const isGold = i % 5 === 0;
      return { angle, dist, size, isGold, delay: Math.random() * 0.1 };
    }), []);

  return (
    <>
      {/* White flash core */}
      <motion.div
        className="absolute rounded-full"
        style={{ background: `radial-gradient(circle, white 0%, ${scheme.crystal} 30%, transparent 70%)` }}
        initial={{ width: 20, height: 20, opacity: 1 }}
        animate={{ width: 400, height: 400, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* Crystal shards */}
      {shards.map((s, i) => (
        <motion.div key={i}
          className="absolute"
          style={{
            width: s.size,
            height: s.size * (2.5 + Math.random()),
            background: s.isGold
              ? `linear-gradient(180deg, hsl(48,100%,75%), hsl(42,100%,55%))`
              : `linear-gradient(180deg, ${scheme.secondary}, ${scheme.primary})`,
            boxShadow: `0 0 ${s.size * 3}px ${s.isGold ? 'hsla(45,100%,65%,0.9)' : scheme.glow}`,
            borderRadius: '2px',
            top: '50%', left: '50%',
            transformOrigin: 'bottom center',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: (s.angle * 180) / Math.PI }}
          animate={{
            x: Math.cos(s.angle) * s.dist,
            y: Math.sin(s.angle) * s.dist,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: s.delay }}
        />
      ))}
      {/* Golden sparkle ring */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const d = 90 + Math.random() * 40;
        return (
          <motion.div key={`gold-${i}`}
            className="absolute rounded-full"
            style={{
              width: 3, height: 3,
              background: 'hsl(48,100%,75%)',
              boxShadow: '0 0 8px hsl(48,100%,65%)',
              top: '50%', left: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 + i * 0.01 }}
          />
        );
      })}
    </>
  );
}

// ── Settling particles (Phase 5) ──────────────────────────────────────────────
function SettlingParticles({ scheme, count = 16 }) {
  const parts = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 1.2 + Math.random() * 2.2,
      dur: 3 + Math.random() * 4,
      delay: Math.random() * 2,
      color: i % 3 === 0 ? scheme.secondary : i % 3 === 1 ? 'hsl(48,100%,72%)' : scheme.crystal,
    })), [scheme]);

  return (
    <div className="absolute pointer-events-none" style={{ width: 320, height: 320, top: 0, left: '50%', transform: 'translateX(-50%)' }}>
      {parts.map((p, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{ y: [0, -8, 4, 0], opacity: [0.3, 0.85, 0.4, 0.3] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Share row ─────────────────────────────────────────────────────────────────
function ShareRow({ badge }) {
  const [copied, setCopied] = useState(false);
  const text = `🏆 I just unlocked the "${badge.title}" badge on RockHound-GO! (${badge.rarity})`;
  const share = () => {
    if (navigator.share) { navigator.share({ title: 'RockHound-GO Badge', text }); }
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
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
  const [phase, setPhase]           = useState('initiate');
  const [showMaterials, setShowMaterials] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    if (!badge) return;
    setPhase('initiate');
    setShowMaterials(false);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    let elapsed = TIMINGS.initiate;
    PHASES.slice(1).forEach((p) => {
      if (TIMINGS[p] === Infinity) return;
      timers.current.push(setTimeout(() => setPhase(p), elapsed));
      elapsed += TIMINGS[p];
    });
    // final complete
    timers.current.push(setTimeout(() => setPhase('complete'), elapsed));

    return () => timers.current.forEach(clearTimeout);
  }, [badge]);

  if (!badge) return null;

  const scheme    = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const completed = phase === 'complete';
  const showBadge = phase === 'reveal' || phase === 'complete';
  const showBurst = phase === 'burst';

  return (
    <AnimatePresence>
      <motion.div
        key="unlock-overlay"
        className="fixed inset-0 z-[9000] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, hsla(260,90%,4%,0.96) 0%, hsla(250,80%,2%,0.98) 100%)',
          backdropFilter: 'blur(12px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Star-field background dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 1.5 + 0.5,
                height: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.25 + 0.05,
              }}
            />
          ))}
        </div>

        {/* Close — only after complete */}
        {completed && (
          <motion.button onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white/80 transition z-10"
            style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.12)' }}
            aria-label="Close unlock animation"
          >
            <X size={18} />
          </motion.button>
        )}

        {/* ── Centre Stage ── */}
        <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>

          {/* Phase 1: Initiate — gathering dust */}
          {phase === 'initiate' && (
            <>
              <motion.div className="absolute rounded-full"
                style={{ background: `radial-gradient(circle, ${scheme.glow.replace('0.9','0.07')} 0%, transparent 70%)` }}
                initial={{ width: 60, height: 60, opacity: 0 }}
                animate={{ width: 320, height: 320, opacity: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
              <DustMotes color={scheme.secondary} />
            </>
          )}

          {/* Phase 2: Charge */}
          {phase === 'charge' && <ChargeRings scheme={scheme} />}

          {/* Phase 3: Burst */}
          {showBurst && <CrystalBurst scheme={scheme} />}

          {/* Phase 4 + 5: Badge */}
          <AnimatePresence>
            {showBadge && (
              <motion.div
                key="badge-reveal"
                className="relative flex flex-col items-center"
                initial={{ scale: 0.25, opacity: 0, rotateY: -90, filter: 'brightness(3)' }}
                animate={{ scale: 1, opacity: 1, rotateY: 0, filter: 'brightness(1)' }}
                transition={{ duration: 1.1, ease: [0.12, 1, 0.28, 1] }}
              >
                <motion.div
                  animate={completed ? { y: [0, -10, 0], filter: ['brightness(1)', 'brightness(1.08)', 'brightness(1)'] } : {}}
                  transition={completed ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  <LiquidMineralBadge badge={badge} size={172} locked={false} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ambient charge/burst glow */}
          {(phase === 'charge' || phase === 'burst') && (
            <motion.div className="absolute pointer-events-none"
              style={{
                width: 280, height: 280,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${scheme.glow.replace('0.9','0.38')} 0%, transparent 65%)`,
                filter: 'blur(20px)',
              }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.55, repeat: Infinity }}
            />
          )}

          {/* Settling particles on complete */}
          {completed && <SettlingParticles scheme={scheme} count={20} />}
        </div>

        {/* ── Text: Reveal → Complete ── */}
        <AnimatePresence>
          {showBadge && (
            <motion.div
              className="flex flex-col items-center text-center px-8 mt-2"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-[10px] uppercase tracking-[0.5em] mb-2 flex items-center gap-2"
                style={{ color: scheme.secondary }}>
                <Sparkles size={10} /> Badge Unlocked <Sparkles size={10} />
              </div>
              <h2 className="text-white text-[26px] font-black tracking-wide mb-1.5 leading-tight"
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
            className="flex flex-col items-center gap-3 mt-5 w-full px-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
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

        {/* Phase label */}
        {!completed && (
          <div className="absolute bottom-8 text-[9px] uppercase tracking-[0.5em] text-white/12">
            {phase}…
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}