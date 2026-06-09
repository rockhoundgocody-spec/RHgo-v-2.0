/**
 * BadgeUnlockAnimation — Cinematic 5-phase badge unlock sequence
 *
 * Exact reference image spec:
 * Phase 1 – INITIATE : Badge dark, stone texture only, void gathers
 * Phase 2 – CHARGE   : Purple veins light up, rotating conic rings contract
 * Phase 3 – BURST    : Crystal explodes, particle scatter + light rays + white flash
 * Phase 4 – REVEAL   : Full badge flips into view, glowing title plate + rarity
 * Phase 5 – COMPLETE : Floating idle, ambient golden dust settles, share actions
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Sparkles } from 'lucide-react';
import LiquidMineralBadge, { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';
import BadgeMaterialPanel from './BadgeMaterialPanel.jsx';

const PHASES  = ['initiate', 'charge', 'burst', 'reveal', 'complete'];
const TIMINGS = { initiate: 900, charge: 1100, burst: 580, reveal: 1200, complete: Infinity };

// ── Helpers ───────────────────────────────────────────────────────────────────
function rand(min, max) { return min + Math.random() * (max - min); }

// ── Phase 1: Initiate — stone base gathering ─────────────────────────────────
function PhaseInitiate({ color }) {
  return (
    <>
      {/* Void expanding pulse */}
      <motion.div
        className="absolute rounded-full"
        style={{ background: `radial-gradient(circle, ${color.replace('0.92','0.08')} 0%, transparent 70%)` }}
        initial={{ width: 30, height: 30, opacity: 0 }}
        animate={{ width: 340, height: 340, opacity: 1 }}
        transition={{ duration: 0.88, ease: 'easeOut' }}
      />
      {/* Stone dust motes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 80 + i * 8;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{ width: 2, height: 2, top: '50%', left: '50%' }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * r * 0.4,
              y: Math.sin(angle) * r * 0.4,
              opacity: [0, 0.35, 0],
            }}
            transition={{ duration: 0.9, delay: i * 0.06, ease: 'easeOut' }}
          />
        );
      })}
    </>
  );
}

// ── Phase 2: Charge — energy veins light up ──────────────────────────────────
function PhaseCharge({ scheme }) {
  return (
    <>
      {/* Contracting rings */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 240 - i * 44,
            height: 240 - i * 44,
            border: `${2.2 - i * 0.4}px solid ${scheme.glow.replace('0.92', String(0.55 - i * 0.1))}`,
            boxShadow: `0 0 ${22 - i * 4}px ${scheme.glow.replace('0.92','0.38')}`,
          }}
          initial={{ scale: 1.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.0, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}

      {/* Central gathering orb */}
      <motion.div className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle, ${scheme.crystal} 0%, ${scheme.glow.replace('0.92','0.6')} 45%, transparent 70%)`,
          filter: `blur(2px)`,
        }}
        initial={{ width: 16, height: 16, opacity: 0.3 }}
        animate={{ width: 88, height: 88, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.3, 1] }}
      />

      {/* Rotating conic energy sweep */}
      <motion.div className="absolute w-[210px] h-[210px] rounded-full"
        style={{
          background: `conic-gradient(
            from 0deg,
            transparent 0deg,
            ${scheme.glow.replace('0.92','0.45')} 35deg,
            ${scheme.primary.replace(')', ',0.25)')} 70deg,
            transparent 120deg,
            ${scheme.glow.replace('0.92','0.30')} 200deg,
            transparent 280deg
          )`,
          filter: 'blur(7px)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.95, ease: 'linear', repeat: Infinity }}
      />

      {/* Secondary slower rotation */}
      <motion.div className="absolute w-[160px] h-[160px] rounded-full"
        style={{
          background: `conic-gradient(
            from 90deg,
            transparent 0deg,
            ${scheme.secondary.replace(')', ',0.20)')} 40deg,
            transparent 140deg,
            ${scheme.crystal} 220deg,
            transparent 300deg
          )`,
          filter: 'blur(10px)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, ease: 'linear', repeat: Infinity }}
      />

      {/* Vein streaks — lightning-like lines radiating inward */}
      <svg className="absolute" width="240" height="240" viewBox="0 0 240 240" style={{ opacity: 0.35 }}>
        {[0,1,2,3,4,5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const ox = 120 + Math.cos(angle) * 110;
          const oy = 120 + Math.sin(angle) * 110;
          const mx = 120 + Math.cos(angle + 0.35) * 55;
          const my = 120 + Math.sin(angle + 0.35) * 55;
          return (
            <motion.path
              key={i}
              d={`M ${ox} ${oy} Q ${mx} ${my} 120 120`}
              stroke={scheme.glow}
              strokeWidth="0.8"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.8, 0.3] }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeIn' }}
            />
          );
        })}
      </svg>
    </>
  );
}

// ── Phase 3: Burst — crystal explosion ───────────────────────────────────────
function PhaseBurst({ scheme }) {
  const shardCount = 28;
  return (
    <>
      {/* White flash */}
      <motion.div className="absolute inset-0 rounded-full bg-white pointer-events-none"
        style={{ borderRadius: 0 }}
        initial={{ opacity: 0.95, scale: 0.4 }}
        animate={{ opacity: 0, scale: 2.8 }}
        transition={{ duration: 0.52, ease: 'easeOut' }}
      />

      {/* Radial light rays */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        return (
          <motion.div key={i}
            className="absolute origin-center pointer-events-none"
            style={{
              width: 2, height: rand(60, 130),
              background: `linear-gradient(180deg, ${scheme.crystal} 0%, transparent 100%)`,
              left: '50%', top: '50%',
              transformOrigin: '50% 0%',
              rotate: `${angle}deg`,
              filter: `blur(1px)`,
            }}
            initial={{ scaleY: 0, opacity: 0.9 }}
            animate={{ scaleY: 1, opacity: 0 }}
            transition={{ duration: 0.5, delay: i * 0.015, ease: 'easeOut' }}
          />
        );
      })}

      {/* Crystal shards scatter */}
      {Array.from({ length: shardCount }).map((_, i) => {
        const angle = (i / shardCount) * Math.PI * 2 + rand(-0.2, 0.2);
        const dist  = rand(90, 185);
        const size  = rand(2, 5);
        const color = i % 3 === 0 ? scheme.goldTrim
          : i % 3 === 1 ? scheme.secondary
          : scheme.crystal;
        return (
          <motion.div key={i}
            className="absolute rounded-sm"
            style={{
              width: size, height: size * (i % 2 === 0 ? 2.5 : 1),
              background: color,
              boxShadow: `0 0 ${size * 2.5}px ${color}`,
              top: '50%', left: '50%',
              rotate: `${rand(0, 360)}deg`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.2,
              rotate: `${rand(180, 720)}deg`,
            }}
            transition={{ duration: rand(0.5, 0.75), ease: 'easeOut', delay: rand(0, 0.08) }}
          />
        );
      })}

      {/* Outer ring blast */}
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{
          border: `3px solid ${scheme.glow}`,
          boxShadow: `0 0 20px ${scheme.glow}, inset 0 0 20px ${scheme.glow.replace('0.92','0.2')}`,
        }}
        initial={{ width: 50, height: 50, opacity: 1 }}
        animate={{ width: 340, height: 340, opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
    </>
  );
}

// ── Share buttons ─────────────────────────────────────────────────────────────
function ShareButtons({ badge, scheme }) {
  const [copied, setCopied] = useState(false);
  const text = `🏆 I just unlocked the "${badge.title}" badge on RockHound-GO! (${badge.rarity})`;
  const share = () => {
    if (navigator.share) navigator.share({ title: 'RockHound-GO Badge', text });
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200); }
  };
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200); };
  return (
    <div className="flex gap-2.5">
      <button onClick={share}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wide transition active:scale-95"
        style={{
          background: 'hsla(195,80%,16%,0.65)',
          border: `1px solid ${scheme.rim.replace('0.65','0.45')}`,
          color: scheme.secondary,
          boxShadow: `0 0 12px ${scheme.glow.replace('0.92','0.15')}`,
        }}>
        <Share2 size={11} /> Share
      </button>
      <button onClick={copy}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wide transition active:scale-95"
        style={{
          background: 'hsla(265,60%,16%,0.65)',
          border: `1px solid ${scheme.rim.replace('0.65','0.45')}`,
          color: scheme.secondary,
        }}>
        {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
      </button>
    </div>
  );
}

// ── Main overlay ───────────────────────────────────────────────────────────────
export default function BadgeUnlockAnimation({ badge, onClose }) {
  const [phase, setPhase] = useState('initiate');
  const [showMaterials, setShowMaterials] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    if (!badge) return;
    setPhase('initiate');
    setShowMaterials(false);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Auto-advance through phases
    let elapsed = 0;
    PHASES.slice(0, -1).forEach((ph, i) => {
      elapsed += TIMINGS[ph];
      const t = setTimeout(() => setPhase(PHASES[i + 1]), elapsed);
      timers.current.push(t);
    });
    return () => timers.current.forEach(clearTimeout);
  }, [badge]);

  if (!badge) return null;

  const scheme   = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const completed = phase === 'complete';
  const showBadge = phase === 'reveal' || phase === 'complete';

  // Rarity label style
  const RARITY_PILL = {
    common:    'bg-white/10 text-white/55 border-white/15',
    uncommon:  'bg-emerald-900/30 text-emerald-300 border-emerald-400/30',
    rare:      'bg-sky-900/30 text-sky-300 border-sky-400/30',
    epic:      'bg-purple-900/30 text-amethyst-glow border-amethyst/40',
    legendary: 'bg-amber-900/30 text-amber-300 border-amber-400/40',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="bua-overlay"
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${scheme.dark.replace(')',', 0.98)')} 0%, hsla(255,80%,3%,0.97) 100%)`,
          backdropFilter: 'blur(14px) saturate(1.4)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ── Background ambient glow ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute" style={{
            inset: '-20%',
            background: `radial-gradient(ellipse at 50% 42%, ${scheme.glow.replace('0.92','0.06')} 0%, transparent 60%)`,
          }} />
          {/* Scan line overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, hsla(0,0%,100%,0.012) 0px, hsla(0,0%,100%,0.012) 1px, transparent 1px, transparent 4px)',
          }} />
        </div>

        {/* ── Close button (complete only) ── */}
        {completed && (
          <motion.button onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white/80 transition z-10"
            style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.12)' }}
            aria-label="Close"
          >
            <X size={18} />
          </motion.button>
        )}

        {/* ── Center stage ── */}
        <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>

          {/* Phase FX */}
          {phase === 'initiate' && <PhaseInitiate color={scheme.glow} />}
          {phase === 'charge'   && <PhaseCharge scheme={scheme} />}
          {phase === 'burst'    && <PhaseBurst scheme={scheme} />}

          {/* Ambient pulse during charge/burst */}
          {(phase === 'charge' || phase === 'burst') && (
            <motion.div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${scheme.glow.replace('0.92','0.32')} 0%, transparent 62%)` }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.55, repeat: Infinity }}
            />
          )}

          {/* Badge reveal (phase 4 + 5) */}
          <AnimatePresence>
            {showBadge && (
              <motion.div
                key="badge"
                className="relative flex flex-col items-center"
                initial={{ scale: 0.28, opacity: 0, rotateY: -90, z: -50 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0, z: 0 }}
                transition={{ duration: 1.05, ease: [0.12, 1, 0.28, 1] }}
                style={{ perspective: 800, transformStyle: 'preserve-3d' }}
              >
                {/* Floating idle animation when complete */}
                <motion.div
                  animate={completed ? {
                    y: [0, -10, 0],
                    rotateZ: [0, 1.5, -1.5, 0],
                  } : {}}
                  transition={completed ? {
                    duration: 5, repeat: Infinity, ease: 'easeInOut',
                  } : {}}
                >
                  <LiquidMineralBadge
                    badge={badge}
                    size={164}
                    locked={false}
                    showPlate={completed}
                  />
                </motion.div>

                {/* Trailing glow on reveal */}
                {phase === 'reveal' && (
                  <motion.div className="absolute inset-0 pointer-events-none rounded-full"
                    style={{ background: `radial-gradient(circle, ${scheme.glow.replace('0.92','0.5')} 0%, transparent 60%)` }}
                    initial={{ opacity: 1, scale: 1.3 }}
                    animate={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 1.0, ease: 'easeOut' }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initiate: dark locked-badge silhouette hint */}
          {phase === 'initiate' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <LiquidMineralBadge badge={badge} size={140} locked={true} />
            </motion.div>
          )}
        </div>

        {/* ── Text reveal ── */}
        <AnimatePresence>
          {showBadge && (
            <motion.div
              className="flex flex-col items-center text-center px-6 mt-2"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.65 }}
            >
              {/* Badge unlocked pill */}
              <motion.div
                className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.45em] mb-2.5"
                style={{ color: scheme.goldTrim }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Sparkles size={9} />
                Badge Unlocked
                <Sparkles size={9} />
              </motion.div>

              {/* Title with glow */}
              <h2
                className="text-white text-2xl font-bold tracking-wide mb-1.5"
                style={{ textShadow: `0 0 22px ${scheme.glow}, 0 0 44px ${scheme.glow.replace('0.92','0.30')}` }}
              >
                {badge.title}
              </h2>

              {/* Rarity pill */}
              <div className={`text-[9px] uppercase tracking-[0.3em] px-3 py-1 rounded-full border mb-2 ${RARITY_PILL[badge.rarity] || RARITY_PILL.common}`}>
                {badge.rarity}
              </div>

              {/* Description */}
              <p className="text-white/52 text-sm max-w-xs leading-relaxed">{badge.description}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Complete actions ── */}
        {completed && (
          <motion.div
            className="flex flex-col items-center gap-3 mt-5"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <ShareButtons badge={badge} scheme={scheme} />

            {/* Material panel toggle */}
            <button
              onClick={() => setShowMaterials(v => !v)}
              className="text-[10px] uppercase tracking-wider text-white/28 hover:text-white/60 transition mt-1"
            >
              {showMaterials ? '▲ Hide' : '▼ View'} Material Breakdown
            </button>

            <AnimatePresence>
              {showMaterials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-80 overflow-hidden"
                >
                  <BadgeMaterialPanel badge={badge} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue CTA */}
            <motion.button
              onClick={onClose}
              className="mt-1 px-12 py-3.5 rounded-full text-sm font-bold tracking-wide transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
                color: 'hsl(255,65%,10%)',
                boxShadow: `0 0 24px ${scheme.glow.replace('0.92','0.55')}, 0 4px 20px ${scheme.dark}`,
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Continue →
            </motion.button>
          </motion.div>
        )}

        {/* Phase debug label */}
        {!completed && (
          <div className="absolute bottom-8 text-[8px] uppercase tracking-[0.45em] text-white/12 font-mono">
            {phase}…
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}