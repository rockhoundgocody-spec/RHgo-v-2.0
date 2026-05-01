import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidCrystalBadge from './LiquidCrystalBadge.jsx';
import { X } from 'lucide-react';

// 5-phase unlock sequence: charge → crack → burst → reveal → settle
const PHASES = ['charge', 'crack', 'burst', 'reveal', 'settle'];
const TIMINGS = { charge: 900, crack: 600, burst: 500, reveal: 1200, settle: Infinity };

export default function BadgeUnlockOverlay({ badge, onClose }) {
  const [phase, setPhase] = useState('charge');

  useEffect(() => {
    if (!badge) return;
    setPhase('charge');
    let cancelled = false;
    let timers = [];
    const advance = (i) => {
      if (cancelled) return;
      const next = PHASES[i];
      setPhase(next);
      if (TIMINGS[next] !== Infinity) {
        timers.push(setTimeout(() => advance(i + 1), TIMINGS[next]));
      }
    };
    timers.push(setTimeout(() => advance(1), TIMINGS.charge));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [badge]);

  if (!badge) return null;

  const showBurst = phase === 'burst';
  const showCrack = phase === 'crack' || phase === 'burst';
  const showBadge = phase === 'reveal' || phase === 'settle';
  const settled = phase === 'settle';

  return (
    <AnimatePresence>
      <motion.div
        key="badge-unlock"
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Close button — only after settle */}
        {settled && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Phase 1 — charge: dark vortex builds */}
        {phase === 'charge' && (
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1, rotate: 360 }}
            transition={{ duration: 0.9 }}
            style={{
              background:
                'conic-gradient(from 0deg, transparent, hsla(280,100%,55%,0.4), transparent, hsla(280,100%,55%,0.4), transparent)',
              filter: 'blur(20px)',
            }}
          />
        )}

        {/* Phase 2 — crack: fracture light leaks */}
        {showCrack && (
          <motion.div
            className="absolute w-[260px] h-[260px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <motion.div
                key={deg}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  width: 130,
                  height: 2,
                  background:
                    'linear-gradient(90deg, hsla(280,100%,80%,1) 0%, hsla(45,100%,75%,0.8) 50%, transparent 100%)',
                  transform: `translateY(-50%) rotate(${deg}deg)`,
                  filter: 'blur(0.5px)',
                  boxShadow: '0 0 12px hsla(280,100%,70%,0.9)',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: deg * 0.001 }}
              />
            ))}
          </motion.div>
        )}

        {/* Phase 3 — burst: radial explosion */}
        {showBurst && (
          <>
            <motion.div
              className="absolute rounded-full"
              initial={{ width: 50, height: 50, opacity: 1 }}
              animate={{ width: 800, height: 800, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                background:
                  'radial-gradient(circle, hsla(0,0%,100%,1) 0%, hsla(280,100%,70%,0.6) 30%, transparent 70%)',
              }}
            />
            {/* Crystal shard particles */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              const dist = 200 + Math.random() * 100;
              return (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-white"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ boxShadow: '0 0 8px hsla(280,100%,80%,1)' }}
                />
              );
            })}
          </>
        )}

        {/* Phase 4 + 5 — reveal & settle: badge presented */}
        <AnimatePresence>
          {showBadge && (
            <motion.div
              key="reveal"
              className="relative flex flex-col items-center"
              initial={{ scale: 0.4, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ y: 0 }}
                animate={settled ? { y: [0, -6, 0] } : {}}
                transition={settled ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                <LiquidCrystalBadge rarity={badge.rarity} icon={badge.icon} size={200} />
              </motion.div>
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="text-amethyst-glow text-[10px] uppercase tracking-[0.4em] mb-2">
                  Badge Unlocked
                </div>
                <h2 className="text-white text-3xl font-bold tracking-wide glow-amethyst mb-2">
                  {badge.title}
                </h2>
                <p className="text-white/70 text-sm max-w-xs mx-auto">{badge.description}</p>
                <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst/70 mt-3">
                  {badge.rarity}
                </div>
              </motion.div>
              {settled && (
                <motion.button
                  onClick={onClose}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 px-8 py-2.5 rounded-full bg-amethyst/30 hover:bg-amethyst/40 border border-amethyst/50 text-white text-sm tracking-wide"
                >
                  Continue
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}