/**
 * BadgeUnlockAnimation — 5-phase cinematic unlock sequence
 *
 * Phase 1 — INITIATE:  Badge starts dark, stone texture only (void gathers)
 * Phase 2 — CHARGE:    Purple veins light up, rings contract, orb builds
 * Phase 3 — BURST:     Crystal explodes — particle shards + light rays + white flash
 * Phase 4 — REVEAL:    Full badge flips into view with glowing text
 * Phase 5 — COMPLETE:  Soft ambient settle + share actions + material panel
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Sparkles } from 'lucide-react';
import LiquidMineralBadge, { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';
import BadgeMaterialPanel from './BadgeMaterialPanel.jsx';

const PHASES = ['initiate', 'charge', 'burst', 'reveal', 'complete'];
const TIMINGS = { initiate: 900, charge: 1100, burst: 580, reveal: 1200, complete: Infinity };

// ── Radial light rays (burst phase) ──────────────────────────────────────────
function LightRays({ color, count = 12 }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        return (
          <motion.div
            key={i}
            className="absolute origin-left"
            style={{
              width: 180 + (i % 3) * 40,
              height: 2 + (i % 2),
              background: `linear-gradient(90deg, ${color}, transparent)`,
              rotate: `${angle}deg`,
              left: '50%', top: '50%',
              marginTop: -(1 + i % 2) * 0.5,
              transformOrigin: '0 50%',
              filter: `blur(${1 + i % 2}px)`,
            }}
            initial={{ scaleX: 0, opacity: .9 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: .55, ease: 'easeOut', delay: i * .012 }}
          />
        );
      })}
    </div>
  );
}

// ── Burst particle shards ─────────────────────────────────────────────────────
function BurstShards({ color, count = 28 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + (Math.random() * .4 - .2);
        const dist  = 90 + Math.random() * 120;
        const size  = 2 + Math.random() * 4;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              background: i % 3 === 0 ? color : i % 3 === 1 ? 'white' : color.replace('0.9','0.7'),
              boxShadow: `0 0 ${size * 2.5}px ${color}`,
              top: '50%', left: '50%',
              marginLeft: -size/2, marginTop: -size/2,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, opacity: 0, scale: .2 }}
            transition={{ duration: .65, ease: 'easeOut', delay: Math.random() * .1 }}
          />
        );
      })}
    </>
  );
}

// ── Phase: Initiate ── dark stone void gathering ──────────────────────────────
function PhaseInitiate({ color }) {
  return (
    <>
      <motion.div className="absolute rounded-full"
        style={{ background: `radial-gradient(circle,${color.replace('0.9','.04')} 0%,transparent 70%)` }}
        initial={{ width: 30, height: 30, opacity: 0 }}
        animate={{ width: 320, height: 320, opacity: 1 }}
        transition={{ duration: .9, ease: 'easeOut' }}
      />
      {/* Stone texture ghost */}
      <motion.div className="absolute"
        style={{
          width: 140, height: 140,
          background: 'radial-gradient(ellipse,hsla(0,0%,18%,.7) 0%,hsla(0,0%,8%,.9) 60%)',
          clipPath: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
          border: `1px solid hsla(0,0%,35%,.3)`,
        }}
        initial={{ opacity: 0, scale: .7 }}
        animate={{ opacity: .7, scale: 1 }}
        transition={{ duration: .85, ease: 'easeOut', delay: .1 }}
      />
    </>
  );
}

// ── Phase: Charge ── veins light up, rings converge ──────────────────────────
function PhaseCharge({ scheme }) {
  return (
    <>
      {/* Converging rings */}
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: 240 - i * 55, height: 240 - i * 55,
            border: `${2.2 - i*.3}px solid ${scheme.glow.replace('0.9', String(.55 - i*.12))}`,
            boxShadow: `0 0 ${22 - i*5}px ${scheme.glow.replace('0.9','.45')}`,
          }}
          initial={{ scale: 1.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.0, delay: i * .14, ease: 'easeInOut' }}
        />
      ))}

      {/* Vein lines */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div key={`vein-${i}`} className="absolute"
          style={{
            width: 90 + (i%3)*20, height: 1.5,
            background: `linear-gradient(90deg,transparent,${scheme.glow.replace('0.9','.7')},transparent)`,
            rotate: `${deg}deg`, left: '50%', top: '50%',
            transformOrigin: '0 50%',
            filter: 'blur(1px)',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: .7, delay: .15 + i*.08, ease: 'easeOut' }}
        />
      ))}

      {/* Central gathering orb */}
      <motion.div className="absolute rounded-full"
        style={{ background: `radial-gradient(circle,${scheme.crystal} 0%,${scheme.glow.replace('0.9','.55')} 42%,transparent 72%)` }}
        initial={{ width: 18, height: 18, opacity: .35 }}
        animate={{ width: 90, height: 90, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      {/* Rotating conic energy sweep */}
      <motion.div className="absolute w-[210px] h-[210px] rounded-full"
        style={{
          background: `conic-gradient(from 0deg,transparent,${scheme.glow.replace('0.9','.45')},transparent,${scheme.glow.replace('0.9','.32')},transparent)`,
          filter: 'blur(9px)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}
      />
    </>
  );
}

// ── Share actions ─────────────────────────────────────────────────────────────
function ShareButtons({ badge, scheme }) {
  const [copied, setCopied] = useState(false);
  const text = `🏆 I just unlocked "${badge.title}" on RockHound-GO! (${badge.rarity})`;
  const share = () => {
    if (navigator.share) navigator.share({ title: 'RockHound-GO Badge', text });
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200); }
  };
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200); };
  return (
    <div className="flex gap-2">
      <button onClick={share} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(195,80%,16%,.65)', border: `1px solid ${scheme.rim}`, color: scheme.secondary }}>
        <Share2 size={11} /> Share
      </button>
      <button onClick={copy} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(265,60%,16%,.65)', border: `1px solid ${scheme.rim}`, color: scheme.secondary }}>
        {copied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy</>}
      </button>
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export default function BadgeUnlockAnimation({ badge, onClose }) {
  const [phase, setPhase]           = useState('initiate');
  const [showMaterials, setShowMat] = useState(false);
  const timers                      = useRef([]);

  useEffect(() => {
    if (!badge) return;
    setPhase('initiate');
    setShowMat(false);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Advance through phases automatically
    let idx = 0;
    const advance = () => {
      idx++;
      const next = PHASES[idx];
      if (!next || TIMINGS[next] === Infinity) { if (next) setPhase(next); return; }
      setPhase(next);
      timers.current.push(setTimeout(advance, TIMINGS[next]));
    };
    timers.current.push(setTimeout(() => {
      setPhase('charge');
      timers.current.push(setTimeout(advance, TIMINGS.charge));
    }, TIMINGS.initiate));

    return () => timers.current.forEach(clearTimeout);
  }, [badge]);

  if (!badge) return null;
  const scheme    = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  const completed = phase === 'complete';
  const showBadge = phase === 'reveal' || phase === 'complete';

  return (
    <AnimatePresence>
      <motion.div
        key="unlock"
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'hsla(260,92%,3%,.94)', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dismiss after complete */}
        {completed && (
          <motion.button onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
            className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white/80 transition"
            style={{ background: 'hsla(0,0%,100%,.05)', border: '1px solid hsla(0,0%,100%,.1)' }}
            aria-label="Close">
            <X size={18} />
          </motion.button>
        )}

        {/* ── Center stage ── */}
        <div className="relative flex items-center justify-center" style={{ width: 340, height: 340 }}>

          {/* Phase: Initiate */}
          {phase === 'initiate' && <PhaseInitiate color={scheme.glow} />}

          {/* Phase: Charge */}
          {phase === 'charge' && <PhaseCharge scheme={scheme} />}

          {/* Phase: Burst */}
          {phase === 'burst' && (
            <>
              <motion.div className="absolute inset-0 flex items-center justify-center">
                <motion.div className="rounded-full bg-white"
                  initial={{ opacity: 1, scale: .4 }}
                  animate={{ opacity: 0, scale: 3.5 }}
                  transition={{ duration: .52, ease: 'easeOut' }}
                  style={{ width: 120, height: 120 }}
                />
              </motion.div>
              <LightRays color={scheme.secondary} count={14} />
              <BurstShards color={scheme.secondary} count={30} />
            </>
          )}

          {/* Ambient outer glow during charge + burst */}
          {(phase === 'charge' || phase === 'burst') && (
            <motion.div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle,${scheme.glow.replace('0.9','.38')} 0%,transparent 65%)` }}
              animate={{ scale: [1, 1.12, 1], opacity: [.5, 1, .5] }}
              transition={{ duration: .65, repeat: Infinity }}
            />
          )}

          {/* Phase: Reveal + Complete — badge materialises */}
          <AnimatePresence>
            {showBadge && (
              <motion.div
                key="badge"
                className="relative flex flex-col items-center"
                initial={{ scale: .28, opacity: 0, rotateY: -90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  animate={completed ? { y: [0, -9, 0] } : {}}
                  transition={completed ? { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  <LiquidMineralBadge badge={badge} size={165} locked={false} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Text plate (reveal + complete) ── */}
        <AnimatePresence>
          {showBadge && (
            <motion.div
              className="flex flex-col items-center text-center px-6 mt-3"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: .38, duration: .65 }}
            >
              <div className="text-[10px] uppercase tracking-[.45em] mb-1.5 flex items-center gap-2"
                style={{ color: scheme.secondary }}>
                <Sparkles size={9} /> Badge Unlocked <Sparkles size={9} />
              </div>
              <h2 className="text-white text-2xl font-black tracking-wide mb-1"
                style={{ textShadow: `0 0 22px ${scheme.glow},0 0 44px ${scheme.glow.replace('0.9','.35')}` }}>
                {badge.title}
              </h2>
              <p className="text-white/55 text-sm max-w-xs leading-relaxed">{badge.description}</p>
              <div className="text-[9px] uppercase tracking-[.3em] mt-2 px-3 py-1 rounded-full"
                style={{ background: `${scheme.primary.replace(')',',0.15)')}`, border: `1px solid ${scheme.rim}`, color: scheme.secondary }}>
                {badge.rarity}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Complete: actions ── */}
        {completed && (
          <motion.div
            className="flex flex-col items-center gap-3 mt-5"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .6 }}
          >
            <ShareButtons badge={badge} scheme={scheme} />

            <button onClick={() => setShowMat(v => !v)}
              className="text-[10px] uppercase tracking-wider text-white/28 hover:text-white/60 transition mt-1">
              {showMaterials ? '▲ Hide' : '▼ View'} Material Breakdown
            </button>

            <AnimatePresence>
              {showMaterials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="w-80 overflow-hidden">
                  <BadgeMaterialPanel badge={badge} />
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={onClose}
              className="mt-2 px-10 py-3 rounded-full text-sm font-bold tracking-wide transition active:scale-95"
              style={{
                background: `linear-gradient(135deg,${scheme.primary},${scheme.secondary})`,
                color: 'hsl(255,62%,10%)',
                boxShadow: `0 0 22px ${scheme.glow.replace('0.9','.52')}`,
              }}>
              Continue →
            </button>
          </motion.div>
        )}

        {/* Phase indicator */}
        {!completed && (
          <div className="absolute bottom-8 text-[9px] uppercase tracking-[.4em] text-white/14">
            {phase}…
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}