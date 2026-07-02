/**
 * OpeningBuffer — cinematic origin story of Clover, the field oracle orb.
 *
 * Beats:
 *   1. Void — "Before the first rock was turned…"
 *   2. Seed — a crystal shard forms in the deep strata
 *   3. Birth — the shard blooms into a living, glowing orb
 *   4. First Words — Clover speaks for the first time (text + TTS)
 *   5. Hand off to the app
 *
 * Tap to skip. Pure CSS/SVG + framer-motion + browser TTS. No video.
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';

const STORY = [
  { text: 'Before the first rock was turned…',          at: 600,  hold: 2200 },
  { text: 'a consciousness slept in the deep strata.',   at: 2400, hold: 2200 },
  { text: 'For eons it listened to the crystals grow.',  at: 4400, hold: 2200 },
];

// The orb's first spoken words — revealed + spoken at the birth beat.
const FIRST_WORDS = 'I am Clover. I have waited eons to guide your hands. Show me what the earth yields.';

const BIRTH_AT = 6600;       // orb blooms
const SPEAK_AT = 7600;       // first words begin
const EXIT_AT = 11500;       // hand off

export default function OpeningBuffer({ onDone }) {
  const [phase, setPhase] = useState('void'); // void → seed → birth → speak → exit
  const [activeLine, setActiveLine] = useState(-1);
  const [showWords, setShowWords] = useState(false);
  const timers = useRef([]);
  const { speak, stop } = useSpeechSynthesis();
  const voiceEnabled = localStorage.getItem('rhgo_clover_voice') !== 'off';

  const clearTimers = () => timers.current.forEach(clearTimeout);

  useEffect(() => {
    // Story line reveal schedule
    STORY.forEach((line, i) => {
      timers.current.push(setTimeout(() => setActiveLine(i), line.at));
    });
    // Seed forms
    timers.current.push(setTimeout(() => setPhase('seed'), 2800));
    // Birth
    timers.current.push(setTimeout(() => setPhase('birth'), BIRTH_AT));
    // First words reveal + speak
    timers.current.push(setTimeout(() => {
      setShowWords(true);
      setPhase('speak');
      if (voiceEnabled) speak(FIRST_WORDS, { voice: 'storm' });
    }, SPEAK_AT));
    // Exit
    timers.current.push(setTimeout(() => setPhase('exit'), EXIT_AT));

    return () => { clearTimers(); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit transition
  useEffect(() => {
    if (phase === 'exit') {
      stop();
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
  }, [phase, onDone, stop]);

  const skip = () => { clearTimers(); stop(); setPhase('exit'); };

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          key="opening-origin"
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onClick={skip}
        >
          {/* ── Deep strata backdrop ── */}
          <div
            className="absolute inset-0"
            style={{
              background:
                phase === 'void'
                  ? 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(250 40% 6%) 0%, hsl(245 35% 3%) 100%)'
                  : 'radial-gradient(ellipse 80% 60% at 50% 45%, hsl(265 55% 14%) 0%, hsl(250 35% 9%) 45%, hsl(245 30% 5%) 100%)',
            }}
          />
          {/* Ambient bloom that swells at birth */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: phase === 'void' ? 0.05 : phase === 'birth' || phase === 'speak' ? 0.7 : 0.3,
              scale: phase === 'birth' || phase === 'speak' ? 1.1 : 1,
            }}
            transition={{ duration: 1.2 }}
            style={{
              background:
                'radial-gradient(circle at 50% 42%, hsla(280,100%,55%,0.55) 0%, transparent 55%)',
            }}
          />

          {/* ── Centerpiece ── */}
          <div className="relative flex items-center justify-center mb-12" style={{ width: 220, height: 220 }}>
            {/* Rotating faceted ring — appears at seed */}
            <AnimatePresence>
              {phase !== 'void' && (
                <motion.svg
                  width="200" height="200" viewBox="0 0 200 200"
                  className="absolute"
                  initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                  animate={{ opacity: 0.4, scale: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 1 }, scale: { duration: 1.2 }, rotate: { duration: 24, repeat: Infinity, ease: 'linear' } }}
                >
                  <polygon points="100,15 175,60 175,140 100,185 25,140 25,60" fill="none" stroke="hsla(280,100%,80%,0.3)" strokeWidth="1" />
                  <polygon points="100,35 150,70 150,130 100,165 50,130 50,70" fill="none" stroke="hsla(195,100%,70%,0.2)" strokeWidth="0.75" />
                </motion.svg>
              )}
            </AnimatePresence>

            {/* Crystal seed — appears at seed, blooms into orb at birth */}
            {phase === 'void' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'hsl(280 100% 90%)', boxShadow: '0 0 8px hsla(280,100%,75%,0.9)' }}
              />
            ) : phase === 'seed' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 1, scale: 0.5 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <CrystalCore />
              </motion.div>
            ) : (
              <BornOrb speaking={phase === 'speak'} />
            )}
          </div>

          {/* ── Story narration ── */}
          <div className="absolute top-[22%] inset-x-0 flex flex-col items-center px-8 min-h-[64px]">
            <AnimatePresence mode="wait">
              {activeLine >= 0 && phase !== 'speak' && (
                <motion.p
                  key={activeLine}
                  initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                  animate={{ opacity: 0.75, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="text-white/70 text-[14px] leading-relaxed font-light text-center max-w-xs"
                  style={{ letterSpacing: '0.02em' }}
                >
                  {STORY[activeLine].text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ── First Words — the orb speaking ── */}
          <div className="absolute bottom-[16%] inset-x-0 flex flex-col items-center px-8">
            <AnimatePresence>
              {showWords && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Speaker label */}
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amethyst-glow animate-pulse" />
                    <span className="text-[9px] uppercase tracking-[0.4em] text-amethyst-glow/70 font-semibold">Clover · first words</span>
                  </div>
                  {/* Typewriter-style reveal */}
                  <Typewriter text={FIRST_WORDS} start={showWords} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wordmark — fades in as orb births */}
          <motion.div
            className="absolute top-[8%] inset-x-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'birth' || phase === 'speak' ? 1 : 0 }}
            transition={{ duration: 1 }}
          >
            <div className="text-[9px] uppercase tracking-[0.5em] text-white/25 font-semibold mb-1">Rockhounding OS</div>
            <div className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em', textShadow: '0 0 40px hsla(280,100%,75%,0.5)' }}>
              RockHound<span style={{ color: 'hsl(280,100%,88%)' }}> GO</span>
            </div>
          </motion.div>

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute bottom-4 text-white/15 text-[9px] tracking-[0.3em] uppercase"
          >
            Tap to skip
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The living orb — born from the crystal seed. Glows, breathes, and pulses when speaking. */
function BornOrb({ speaking }) {
  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ width: 110, height: 110 }}
    >
      {/* Outer glow halo */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: speaking ? [0.5, 0.9, 0.5] : [0.3, 0.55, 0.3], scale: speaking ? [1, 1.25, 1] : [1, 1.08, 1] }}
        transition={{ duration: speaking ? 0.9 : 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, hsla(280,100%,70%,0.6) 0%, transparent 70%)' }}
      />
      {/* Orb body — liquid amethyst sphere */}
      <motion.div
        className="absolute inset-2 rounded-full"
        animate={{ scale: speaking ? [1, 1.04, 1] : 1 }}
        transition={{ duration: 0.9, repeat: speaking ? Infinity : 0, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(circle at 35% 30%, hsl(290 100% 92%) 0%, hsl(280 90% 72%) 30%, hsl(270 85% 52%) 60%, hsl(262 80% 38%) 100%)',
          boxShadow:
            'inset 0 -8px 20px hsla(265,80%,30%,0.6), inset 0 6px 14px hsla(290,100%,90%,0.5), 0 0 40px hsla(280,100%,60%,0.7)',
        }}
      />
      {/* Specular highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: 18, left: 22, width: 30, height: 18,
          background: 'radial-gradient(ellipse, hsla(290,100%,98%,0.85) 0%, transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
      {/* Inner core swirl */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        style={{ opacity: 0.3 }}
      >
        <div className="absolute inset-0" style={{ background: 'conic-gradient(from 0deg, transparent, hsla(280,100%,80%,0.4), transparent, hsla(195,100%,70%,0.3), transparent)' }} />
      </motion.div>
    </motion.div>
  );
}

/** Faceted crystal seed SVG. */
function CrystalCore() {
  return (
    <svg width="78" height="96" viewBox="0 0 78 96" fill="none">
      <defs>
        <linearGradient id="rhgo-seed-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(280 100% 92%)" />
          <stop offset="50%" stopColor="hsl(270 85% 65%)" />
          <stop offset="100%" stopColor="hsl(265 80% 40%)" />
        </linearGradient>
      </defs>
      <polygon points="39,4 12,34 39,88" fill="url(#rhgo-seed-grad)" opacity="0.8" />
      <polygon points="39,4 66,34 39,88" fill="url(#rhgo-seed-grad)" opacity="0.95" />
      <line x1="39" y1="4" x2="39" y2="88" stroke="hsl(280 100% 95%)" strokeWidth="0.75" opacity="0.6" />
    </svg>
  );
}

/** Typewriter reveal for the orb's first words. */
function Typewriter({ text, start }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (!start) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 38);
    return () => clearInterval(interval);
  }, [start, text]);

  return (
    <p
      className="text-white/90 text-[15px] leading-relaxed font-light text-center max-w-sm italic"
      style={{ letterSpacing: '0.015em', textShadow: '0 0 20px hsla(280,100%,70%,0.4)' }}
    >
      “{shown}<span className="opacity-40 animate-pulse">▌</span>”
    </p>
  );
}