/**
 * IntroCinematic — plays once on first app launch.
 * Pure CSS/framer-motion — no video file needed.
 * Tap anywhere or wait ~6s to skip.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem } from 'lucide-react';

const LINES = [
  { text: 'The earth is hiding something…',  delay: 0.4,  duration: 1.4 },
  { text: 'Every rock has a story.',          delay: 2.0,  duration: 1.4 },
  { text: 'Are you ready to find yours?',     delay: 3.5,  duration: 1.4 },
];

// Floating crystal particle
function Crystal({ style, delay }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-2xl"
      initial={{ opacity: 0, y: 30, scale: 0.6 }}
      animate={{ opacity: [0, 0.6, 0.6, 0], y: [30, -60], scale: [0.6, 1.1, 1], rotate: [0, 20] }}
      transition={{ delay, duration: 3.5, ease: 'easeOut' }}
      style={style}
    >
      💎
    </motion.div>
  );
}

const CRYSTALS = [
  { style: { left: '10%',  top: '30%' }, delay: 0.5 },
  { style: { left: '80%',  top: '20%' }, delay: 0.9 },
  { style: { left: '55%',  top: '65%' }, delay: 1.4 },
  { style: { left: '20%',  top: '70%' }, delay: 0.7 },
  { style: { left: '70%',  top: '55%' }, delay: 1.1 },
  { style: { left: '40%',  top: '15%' }, delay: 1.7 },
  { style: { left: '88%',  top: '75%' }, delay: 0.3 },
  { style: { left: '5%',   top: '55%' }, delay: 2.0 },
];

export default function IntroCinematic({ onDone }) {
  const [phase, setPhase] = useState('intro'); // intro | outro

  useEffect(() => {
    // Auto-advance after 5.8s
    const t = setTimeout(() => setPhase('outro'), 5800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === 'outro') {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  return (
    <AnimatePresence>
      {phase === 'intro' && (
        <motion.div
          key="cinematic"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, hsl(270 65% 18%) 0%, hsl(255 35% 10%) 45%, hsl(245 25% 5%) 100%)',
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onClick={() => setPhase('outro')}
        >
          {/* Ambient light bloom */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{
              background: 'radial-gradient(circle at 50% 45%, hsla(280,100%,55%,0.18) 0%, transparent 60%)',
            }}
          />

          {/* Floating crystals */}
          {CRYSTALS.map((c, i) => <Crystal key={i} style={c.style} delay={c.delay} />)}

          {/* Center orb */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            transition={{ delay: 0.1, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-8"
          >
            {/* Glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'radial-gradient(circle, hsla(280,100%,65%,0.35) 0%, transparent 70%)',
                width: 120, height: 120, left: -20, top: -20,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 2.0, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              style={{
                background: 'radial-gradient(circle, hsla(265,80%,55%,0.2) 0%, transparent 70%)',
                width: 120, height: 120, left: -20, top: -20,
              }}
            />

            {/* Orb body */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center relative"
              style={{
                background: 'radial-gradient(circle at 38% 32%, hsla(280,80%,68%,0.5), hsla(260,60%,22%,0.8))',
                border: '1px solid hsla(280,70%,72%,0.45)',
                boxShadow: '0 0 60px hsla(280,100%,60%,0.5), 0 0 120px hsla(265,80%,45%,0.3), inset 0 1px 0 hsla(280,100%,95%,0.25)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Gem size={32} style={{ color: 'hsl(280,100%,88%)', filter: 'drop-shadow(0 0 12px hsla(280,100%,70%,0.8))' }} />
              </motion.div>
            </div>
          </motion.div>

          {/* App name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center mb-6"
          >
            <div className="text-[11px] uppercase tracking-[0.5em] text-white/30 mb-2 font-semibold">
              Built by collectors · for collectors
            </div>
            <div
              className="text-5xl font-black text-white"
              style={{
                letterSpacing: '-0.02em',
                textShadow: '0 0 60px hsla(280,100%,75%,0.7), 0 0 120px hsla(265,80%,50%,0.4)',
              }}
            >
              RockHound
              <span style={{ color: 'hsl(280,100%,88%)' }}> GO</span>
            </div>
          </motion.div>

          {/* Story lines */}
          <div className="flex flex-col items-center gap-1 px-8 text-center">
            {LINES.map(({ text, delay, duration }) => (
              <motion.p
                key={text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] }}
                transition={{
                  delay,
                  duration: duration + 0.8,
                  times: [0, 0.2, 0.7, 1],
                  ease: 'easeInOut',
                }}
                className="text-white/60 text-[15px] leading-relaxed font-light"
                style={{ letterSpacing: '0.02em' }}
              >
                {text}
              </motion.p>
            ))}
          </div>

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute bottom-10 text-white/20 text-[11px] tracking-[0.25em] uppercase"
          >
            Tap to skip
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}