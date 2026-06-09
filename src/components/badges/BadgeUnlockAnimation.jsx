/**
 * BadgeUnlockAnimation — 5-phase cinematic unlock sequence
 * 1. Initiate  (dark void / gathering)
 * 2. Charge    (energy builds, rings contract)
 * 3. Burst     (particle explosion + white flash)
 * 4. Reveal    (badge materialises with full glow)
 * 5. Complete  (soft settle + share actions)
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check } from 'lucide-react';
import LiquidMineralBadge, { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';
import BadgeMaterialPanel from './BadgeMaterialPanel.jsx';

const PHASES = ['initiate', 'charge', 'burst', 'reveal', 'complete'];
const TIMINGS = { initiate: 800, charge: 1000, burst: 550, reveal: 1100, complete: Infinity };

// ── Burst shards ─────────────────────────────────────────────────────────────
function BurstShards({ color, count = 20 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 160 + Math.random() * 80;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              background: color,
              boxShadow: `0 0 8px ${color}`,
              top: '50%', left: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: Math.random() * 0.08 }}
          />
        );
      })}
    </>
  );
}

// ── Share buttons ─────────────────────────────────────────────────────────────
function ShareButtons({ badge }) {
  const [copied, setCopied] = useState(false);
  const text = `🏆 I just unlocked the "${badge.title}" badge on RockHound-GO! (${badge.rarity})`;
  const share = () => {
    if (navigator.share) { navigator.share({ title: 'RockHound-GO Badge', text }); }
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex gap-2">
      <button onClick={share} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(195,80%,18%,0.6)', border: '1px solid hsla(195,80%,55%,0.35)', color: 'hsl(195,100%,82%)' }}>
        <Share2 size={11} /> Share
      </button>
      <button onClick={copy} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(265,60%,18%,0.6)', border: '1px solid hsla(280,60%,55%,0.35)', color: 'hsl(280,100%,88%)' }}>
        {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
      </button>
    </div>
  );
}

// ── Phase: Initiate ───────────────────────────────────────────────────────────
function PhaseInitiate({ color }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ background: `radial-gradient(circle, ${color.replace('0.9','0.06')} 0%, transparent 70%)` }}
      initial={{ width: 40, height: 40, opacity: 0 }}
      animate={{ width: 300, height: 300, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
}

// ── Phase: Charge ─────────────────────────────────────────────────────────────
function PhaseCharge({ scheme }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: 220 - i * 50, height: 220 - i * 50,
            border: `${2 - i * 0.3}px solid ${scheme.glow.replace('0.9', String(0.5 - i * 0.12))}`,
            boxShadow: `0 0 ${20 - i * 4}px ${scheme.glow.replace('0.9','0.4')}`,
          }}
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
      {/* Gathering orb */}
      <motion.div
        className="absolute rounded-full"
        style={{ background: `radial-gradient(circle, ${scheme.crystal} 0%, ${scheme.glow.replace('0.9','0.5')} 40%, transparent 70%)` }}
        initial={{ width: 20, height: 20, opacity: 0.4 }}
        animate={{ width: 80, height: 80, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* Rotating conic energy */}
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${scheme.glow.replace('0.9','0.4')}, transparent, ${scheme.glow.replace('0.9','0.3')}, transparent)`,
          filter: 'blur(8px)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
      />
    </>
  );
}

// ── Main Overlay ──────────────────────────────────────────────────────────────
export default function BadgeUnlockAnimation({ badge, onClose }) {
  const [phase, setPhase] = useState('initiate');
  const [showMaterials, setShowMaterials] = useState(false);
  const timerRef = useRef([]);

  useEffect(() => {
    if (!badge) return;
    setPhase('initiate');
    setShowMaterials(false);
    timerRef.current.forEach(clearTimeout);

    let idx = 0;
    const advance = () => {
      idx++;
      const next = PHASES[idx];
      if (!next || TIMINGS[next] === Infinity) return;
      setPhase(next);
      timerRef.current.push(setTimeout(advance, TIMINGS[next]));
    };
    timerRef.current.push(setTimeout(() => {
      setPhase('charge');
      timerRef.current.push(setTimeout(advance, TIMINGS.charge));
    }, TIMINGS.initiate));

    return () => timerRef.current.forEach(clearTimeout);
  }, [badge]);

  if (!badge) return null;
  const scheme = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const completed = phase === 'complete';
  const showBadge = phase === 'reveal' || phase === 'complete';
  const showBurst = phase === 'burst';

  return (
    <AnimatePresence>
      <motion.div
        key="unlock-overlay"
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'hsla(260,90%,3%,0.92)', backdropFilter: 'blur(10px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Close — only after complete */}
        {completed && (
          <motion.button
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white/80 transition"
            style={{ background: 'hsla(0,0%,100%,0.05)', border: '1px solid hsla(0,0%,100%,0.1)' }}
            aria-label="Close unlock animation"
          >
            <X size={18} />
          </motion.button>
        )}

        {/* Center stage */}
        <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>

          {phase === 'initiate' && <PhaseInitiate color={scheme.glow} />}
          {phase === 'charge'   && <PhaseCharge scheme={scheme} />}
          {showBurst && (
            <>
              {/* White flash */}
              <motion.div className="absolute inset-0 rounded-full bg-white"
                initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 3 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <BurstShards color={scheme.secondary} count={22} />
            </>
          )}

          {/* Badge reveal */}
          <AnimatePresence>
            {showBadge && (
              <motion.div
                className="relative flex flex-col items-center"
                key="badge-reveal"
                initial={{ scale: 0.3, opacity: 0, rotateY: -80 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  animate={completed ? { y: [0, -8, 0] } : {}}
                  transition={completed ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  <LiquidMineralBadge badge={badge} size={160} locked={false} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ambient outer glow during charge */}
          {(phase === 'charge' || phase === 'burst') && (
            <motion.div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${scheme.glow.replace('0.9','0.35')} 0%, transparent 65%)` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </div>

        {/* Text */}
        <AnimatePresence>
          {showBadge && (
            <motion.div
              className="flex flex-col items-center text-center px-6 mt-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <div className="text-[10px] uppercase tracking-[0.45em] mb-2" style={{ color: scheme.secondary }}>
                Badge Unlocked
              </div>
              <h2 className="text-white text-2xl font-bold tracking-wide mb-1"
                style={{ textShadow: `0 0 20px ${scheme.glow}, 0 0 40px ${scheme.glow.replace('0.9','0.35')}` }}>
                {badge.title}
              </h2>
              <p className="text-white/55 text-sm max-w-xs leading-relaxed">{badge.description}</p>
              <div className="text-[9px] uppercase tracking-[0.3em] mt-2 px-3 py-1 rounded-full"
                style={{ background: `${scheme.primary.replace(')', ',0.15)')}`, border: `1px solid ${scheme.rim}`, color: scheme.secondary }}>
                {badge.rarity}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions: complete */}
        {completed && (
          <motion.div
            className="flex flex-col items-center gap-3 mt-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ShareButtons badge={badge} />

            {/* Material panel toggle */}
            <button
              onClick={() => setShowMaterials(v => !v)}
              className="text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60 transition mt-1"
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

            <button
              onClick={onClose}
              className="mt-2 px-10 py-3 rounded-full text-sm font-bold tracking-wide transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
                color: 'hsl(255,60%,12%)',
                boxShadow: `0 0 20px ${scheme.glow.replace('0.9','0.5')}`,
              }}
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* Phase label (debug hint UX) */}
        {!completed && (
          <div className="absolute bottom-8 text-[9px] uppercase tracking-[0.4em] text-white/15">
            {phase}…
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}