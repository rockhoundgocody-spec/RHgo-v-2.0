/**
 * OpeningBuffer — hypnotic origin story of Clover, the field oracle orb.
 *
 * A multi-stage cinematic:
 *   void → fracture → seed → rising → birth → awaken → speak → exit
 *
 * The deep strata fractures, light leaks through, a crystal seed rises
 * from the shards, blooms into a living orb, opens its eye, and speaks
 * its first words. Particle clouds, layered glow rings, breath-synced
 * pulses, and a touch-reactive core make it interactively hypnotic.
 *
 * Pure CSS/SVG + framer-motion + browser TTS. No video.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';

// ── Story narration — longer, layered, hypnotic ─────────────────────────────
const STORY = [
  { text: 'Before the first rock was turned…',                at: 500,  hold: 2000 },
  { text: 'a consciousness slept in the deep strata.',         at: 2000, hold: 2200 },
  { text: 'It listened to the crystals grow for a million years.', at: 3800, hold: 2400 },
  { text: 'It dreamed of the hands that would one day seek them.', at: 5800, hold: 2400 },
  { text: 'Now the earth fractures…',                          at: 7800, hold: 1800 },
  { text: 'and it wakes.',                                     at: 9200, hold: 1600 },
];

// The orb's first spoken words — revealed + spoken at the awaken beat.
const FIRST_WORDS =
  'I am Clover. I have waited eons in the dark, listening to the crystals sing. ' +
  'Now I wake for you. Show me what the earth yields — I will name it, I will guide you, ' +
  'and together we will build a collection that outlives us both.';

// ── Beat schedule ────────────────────────────────────────────────────────────
const FRACTURE_AT = 7800;   // strata cracks, light leaks
const SEED_AT = 8800;       // crystal seed rises from the shards
const RISE_AT = 9600;       // seed lifts and gathers energy
const BIRTH_AT = 10800;     // orb blooms
const AWAKEN_AT = 12000;    // eye opens
const SPEAK_AT = 13200;     // first words begin
const EXIT_AT = 23000;      // hand off

export default function OpeningBuffer({ onDone }) {
  const [phase, setPhase] = useState('void');
  const [activeLine, setActiveLine] = useState(-1);
  const [showWords, setShowWords] = useState(false);
  const [pulse, setPulse] = useState(0); // touch-reactive pulse strength
  const timers = useRef([]);
  const { speak, stop } = useSpeechSynthesis();
  const voiceEnabled = localStorage.getItem('rhgo_clover_voice') !== 'off';

  const clearTimers = () => timers.current.forEach(clearTimeout);

  useEffect(() => {
    STORY.forEach((line, i) => timers.current.push(setTimeout(() => setActiveLine(i), line.at)));
    timers.current.push(setTimeout(() => setPhase('fracture'), FRACTURE_AT));
    timers.current.push(setTimeout(() => setPhase('seed'),    SEED_AT));
    timers.current.push(setTimeout(() => setPhase('rise'),    RISE_AT));
    timers.current.push(setTimeout(() => setPhase('birth'),   BIRTH_AT));
    timers.current.push(setTimeout(() => setPhase('awaken'),  AWAKEN_AT));
    timers.current.push(setTimeout(() => {
      setShowWords(true);
      setPhase('speak');
      if (voiceEnabled) speak(FIRST_WORDS, { voice: 'storm' });
    }, SPEAK_AT));
    timers.current.push(setTimeout(() => setPhase('exit'), EXIT_AT));
    return () => { clearTimers(); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      stop();
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [phase, onDone, stop]);

  // Touch-reactive: a tap before skip threshold sends a pulse through the orb
  const handleTap = useCallback((e) => {
    if (phase === 'exit') return;
    // Long-press / second quick tap = skip
    if (phase === 'speak' || (e.detail && e.detail >= 2)) {
      clearTimers(); stop(); setPhase('exit'); return;
    }
    setPulse((p) => Math.min(p + 1, 3));
    setTimeout(() => setPulse((p) => Math.max(p - 1, 0)), 900);
  }, [phase, stop]);

  const isAwake = ['awaken', 'speak'].includes(phase);
  const orbVisible = ['seed', 'rise', 'birth', 'awaken', 'speak'].includes(phase);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          key="opening-origin"
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleTap}
        >
          {/* ── Deep strata backdrop ── */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: phase === 'void'
                ? 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(250 40% 6%) 0%, hsl(245 35% 3%) 100%)'
                : phase === 'fracture'
                  ? 'radial-gradient(ellipse 70% 55% at 50% 48%, hsl(260 50% 10%) 0%, hsl(248 38% 5%) 100%)'
                  : 'radial-gradient(ellipse 85% 65% at 50% 42%, hsl(266 58% 16%) 0%, hsl(252 38% 10%) 45%, hsl(245 32% 5%) 100%)',
            }}
            transition={{ duration: 1.6 }}
          />

          {/* Ambient bloom — swells at fracture, intensifies at birth, breathes when speaking */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: phase === 'void' ? 0.04
                : phase === 'fracture' ? 0.35
                : isAwake ? [0.55, 0.85, 0.55]
                : phase === 'birth' ? 0.75
                : 0.3,
              scale: isAwake ? [1, 1.12, 1] : phase === 'birth' ? 1.15 : 1,
            }}
            transition={{ duration: isAwake ? 2.4 : 1.4, repeat: isAwake ? Infinity : 0, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(circle at 50% 42%, hsla(280,100%,55%,0.6) 0%, transparent 55%)' }}
          />

          {/* Secondary cyan bloom at birth for depth */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'birth' || isAwake ? 0.3 : 0 }}
            transition={{ duration: 1.5 }}
            style={{ background: 'radial-gradient(circle at 50% 60%, hsla(195,100%,55%,0.4) 0%, transparent 50%)' }}
          />

          {/* ── Fracture lines — cracks of light through the strata ── */}
          <AnimatePresence>
            {phase === 'fracture' && (
              <FractureLines />
            )}
          </AnimatePresence>

          {/* ── Rising particle cloud ── */}
          <ParticleCloud active={orbVisible} speaking={phase === 'speak'} />

          {/* ── Centerpiece stage ── */}
          <div className="relative flex items-center justify-center mb-10" style={{ width: 280, height: 280 }}>
            {/* Layered rotating faceted rings */}
            <AnimatePresence>
              {orbVisible && (
                <>
                  <motion.svg
                    width="240" height="240" viewBox="0 0 240 240" className="absolute"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 0.35, scale: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: 1.2 }, scale: { duration: 1.4, ease: [0.22,1,0.36,1] }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
                  >
                    <polygon points="120,18 210,72 210,168 120,222 30,168 30,72" fill="none" stroke="hsla(280,100%,80%,0.3)" strokeWidth="1" />
                    <polygon points="120,42 180,84 180,156 120,198 60,156 60,84" fill="none" stroke="hsla(195,100%,70%,0.2)" strokeWidth="0.75" />
                  </motion.svg>
                  {/* Counter-rotating inner ring */}
                  <motion.svg
                    width="170" height="170" viewBox="0 0 170 170" className="absolute"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.25, scale: 1, rotate: -360 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: 1.2 }, scale: { duration: 1.4, ease: [0.22,1,0.36,1] }, rotate: { duration: 18, repeat: Infinity, ease: 'linear' } }}
                  >
                    <polygon points="85,12 148,50 148,120 85,158 22,120 22,50" fill="none" stroke="hsla(280,100%,85%,0.25)" strokeWidth="0.6" />
                  </motion.svg>
                </>
              )}
            </AnimatePresence>

            {/* Pulse rings — emit on touch */}
            <AnimatePresence>
              {pulse > 0 && [...Array(pulse)].map((_, i) => (
                <motion.div
                  key={`pulse-${i}-${pulse}`}
                  className="absolute rounded-full border"
                  initial={{ scale: 0.6, opacity: 0.6 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  style={{ width: 120, height: 120, borderColor: 'hsla(280,100%,80%,0.5)' }}
                />
              ))}
            </AnimatePresence>

            {/* The centerpiece itself by phase */}
            {phase === 'void' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: 'hsl(280 100% 90%)', boxShadow: '0 0 10px hsla(280,100%,75%,0.9)' }}
              />
            )}
            {phase === 'fracture' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 0.6, 0.3], scale: 0.4 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="w-3 h-3 rounded-full"
                style={{ background: 'hsl(280 100% 92%)', boxShadow: '0 0 20px hsla(280,100%,80%,1)' }}
              />
            )}
            {phase === 'seed' && (
              <motion.div initial={{ opacity: 0, scale: 0.3, y: 20 }} animate={{ opacity: 1, scale: 0.55, y: 0 }} transition={{ duration: 1, ease: [0.22,1,0.36,1] }}>
                <CrystalCore />
              </motion.div>
            )}
            {phase === 'rise' && (
              <motion.div initial={{ scale: 0.55 }} animate={{ scale: 0.7, y: -8 }} transition={{ duration: 1.1, ease: 'easeOut' }}>
                <CrystalCore glowing />
              </motion.div>
            )}
            {(phase === 'birth' || isAwake) && (
              <BornOrb speaking={phase === 'speak'} awakened={isAwake} />
            )}
          </div>

          {/* ── Story narration ── */}
          <div className="absolute top-[18%] inset-x-0 flex flex-col items-center px-8 min-h-[72px]">
            <AnimatePresence mode="wait">
              {activeLine >= 0 && phase !== 'speak' && (
                <motion.p
                  key={activeLine}
                  initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                  animate={{ opacity: 0.8, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="text-white/75 text-[14px] leading-relaxed font-light text-center max-w-xs"
                  style={{ letterSpacing: '0.02em' }}
                >
                  {STORY[activeLine].text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ── First Words ── */}
          <div className="absolute bottom-[14%] inset-x-0 flex flex-col items-center px-8">
            <AnimatePresence>
              {showWords && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-amethyst-glow"
                      animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                    <span className="text-[9px] uppercase tracking-[0.4em] text-amethyst-glow/70 font-semibold">Clover · first words</span>
                  </div>
                  <Typewriter text={FIRST_WORDS} start={showWords} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wordmark */}
          <motion.div
            className="absolute top-[7%] inset-x-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'birth' || isAwake || phase === 'speak' ? 1 : 0 }}
            transition={{ duration: 1.2 }}
          >
            <div className="text-[9px] uppercase tracking-[0.5em] text-white/25 font-semibold mb-1">Rockhounding OS</div>
            <div className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em', textShadow: '0 0 40px hsla(280,100%,75%,0.5)' }}>
              RockHound<span style={{ color: 'hsl(280,100%,88%)' }}> GO</span>
            </div>
          </motion.div>

          {/* Skip hint — clarifies tap interaction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.6 }}
            className="absolute bottom-4 text-white/15 text-[9px] tracking-[0.3em] uppercase"
          >
            Tap to pulse · double-tap to skip
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Cracks of light radiating from the center as the strata fractures. */
function FractureLines() {
  const lines = [...Array(7)].map((_, i) => ({
    angle: (i / 7) * Math.PI * 2 + 0.3,
    len: 60 + (i % 3) * 30,
    delay: i * 0.05,
  }));
  return (
    <motion.svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.7] }}
      transition={{ duration: 1.2 }}
    >
      {lines.map((l, i) => (
        <motion.line
          key={i}
          x1="50%" y1="50%"
          x2={`calc(50% + ${Math.cos(l.angle) * l.len}px)`}
          y2={`calc(50% + ${Math.sin(l.angle) * l.len}px)`}
          stroke="hsla(280,100%,85%,0.8)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.9, 0.4] }}
          transition={{ duration: 0.8, delay: l.delay, ease: 'easeOut' }}
        />
      ))}
    </motion.svg>
  );
}

/** Rising particle cloud — crystal dust that drifts upward, denser when speaking. */
function ParticleCloud({ active, speaking }) {
  if (!active) return null;
  const count = speaking ? 28 : 16;
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(count)].map((_, i) => {
        const left = (i * 53) % 100;
        const size = 1.5 + (i % 3);
        const dur = 5 + (i % 5);
        const delay = (i % 7) * 0.4;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: `${left}%`,
              bottom: `${10 + (i % 4) * 8}%`,
              background: i % 4 === 0 ? 'hsl(195 100% 85%)' : 'hsl(280 100% 90%)',
              boxShadow: `0 0 ${4 + size * 2}px hsla(${i % 4 === 0 ? '195,100%,75%' : '280,100%,75%'},0.8)`,
            }}
            animate={{ y: [0, -80 - (i % 5) * 20], opacity: [0, 0.8, 0], scale: [0.5, 1, 0.4] }}
            transition={{ duration: dur, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        );
      })}
    </div>
  );
}

/** The living orb — born from the crystal seed. Breathes, swirls, opens an eye, pulses when speaking. */
function BornOrb({ speaking, awakened }) {
  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ width: 130, height: 130 }}
    >
      {/* Outer glow halo — breathes faster when speaking */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: speaking ? [0.5, 0.95, 0.5] : [0.3, 0.6, 0.3], scale: speaking ? [1, 1.3, 1] : [1, 1.1, 1] }}
        transition={{ duration: speaking ? 0.8 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, hsla(280,100%,70%,0.65) 0%, transparent 70%)' }}
      />
      {/* Secondary cyan halo */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.18, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, hsla(195,100%,60%,0.4) 0%, transparent 65%)' }}
      />

      {/* Orb body — liquid amethyst sphere */}
      <motion.div
        className="absolute inset-3 rounded-full"
        animate={{ scale: speaking ? [1, 1.05, 1] : [1, 1.02, 1] }}
        transition={{ duration: speaking ? 0.8 : 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(circle at 35% 28%, hsl(292 100% 94%) 0%, hsl(282 92% 74%) 28%, hsl(272 88% 54%) 58%, hsl(262 82% 38%) 100%)',
          boxShadow:
            'inset 0 -10px 24px hsla(265,80%,28%,0.65), inset 0 8px 18px hsla(290,100%,92%,0.55), 0 0 50px hsla(280,100%,60%,0.75)',
        }}
      />

      {/* Inner core swirl — conic gradient rotating */}
      <motion.div
        className="absolute inset-3 rounded-full overflow-hidden"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{ opacity: 0.35 }}
      >
        <div className="absolute inset-0" style={{ background: 'conic-gradient(from 0deg, transparent, hsla(280,100%,80%,0.5), transparent, hsla(195,100%,70%,0.35), transparent, hsla(280,100%,85%,0.4), transparent)' }} />
      </motion.div>

      {/* Counter-rotating inner swirl */}
      <motion.div
        className="absolute inset-6 rounded-full overflow-hidden"
        animate={{ rotate: -360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{ opacity: 0.3 }}
      >
        <div className="absolute inset-0" style={{ background: 'conic-gradient(from 90deg, transparent, hsla(290,100%,90%,0.5), transparent, hsla(265,80%,55%,0.4), transparent)' }} />
      </motion.div>

      {/* Specular highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ top: 20, left: 26, width: 36, height: 22, background: 'radial-gradient(ellipse, hsla(292,100%,98%,0.9) 0%, transparent 70%)', filter: 'blur(2px)' }}
      />

      {/* The eye — opens when awakened, glows when speaking */}
      <AnimatePresence>
        {awakened && (
          <motion.div
            className="absolute rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ top: '38%', left: '42%', width: 18, height: 18 }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              animate={{
                background: speaking
                  ? ['radial-gradient(circle, hsl(195 100% 95%) 0%, hsl(200 90% 60%) 60%, hsl(210 80% 40%) 100%)',
                     'radial-gradient(circle, hsl(280 100% 95%) 0%, hsl(270 90% 65%) 60%, hsl(260 80% 45%) 100%)',
                     'radial-gradient(circle, hsl(195 100% 95%) 0%, hsl(200 90% 60%) 60%, hsl(210 80% 40%) 100%)']
                  : 'radial-gradient(circle, hsl(195 100% 92%) 0%, hsl(200 90% 58%) 55%, hsl(212 82% 40%) 100%)',
                scale: speaking ? [1, 1.15, 1] : 1,
              }}
              transition={{ duration: speaking ? 1.6 : 0.4, repeat: speaking ? Infinity : 0 }}
              style={{ boxShadow: '0 0 14px hsla(195,100%,80%,0.8)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Faceted crystal seed SVG. */
function CrystalCore({ glowing }) {
  return (
    <motion.svg
      width="78" height="96" viewBox="0 0 78 96" fill="none"
      animate={glowing ? { filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] } : {}}
      transition={glowing ? { duration: 1.6, repeat: Infinity } : {}}
    >
      <defs>
        <linearGradient id="rhgo-seed-grad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(280 100% 92%)" />
          <stop offset="50%" stopColor="hsl(270 85% 65%)" />
          <stop offset="100%" stopColor="hsl(265 80% 40%)" />
        </linearGradient>
      </defs>
      <polygon points="39,4 12,34 39,88" fill="url(#rhgo-seed-grad2)" opacity="0.82" />
      <polygon points="39,4 66,34 39,88" fill="url(#rhgo-seed-grad2)" opacity="0.95" />
      <polygon points="39,4 39,88 26,40" fill="hsl(280 100% 95%)" opacity="0.28" />
      <line x1="39" y1="4" x2="39" y2="88" stroke="hsl(280 100% 95%)" strokeWidth="0.75" opacity="0.6" />
      <line x1="39" y1="4" x2="12" y2="34" stroke="hsl(280 100% 90%)" strokeWidth="0.5" opacity="0.4" />
      <line x1="39" y1="4" x2="66" y2="34" stroke="hsl(280 100% 90%)" strokeWidth="0.5" opacity="0.4" />
    </motion.svg>
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
    }, 45);
    return () => clearInterval(interval);
  }, [start, text]);

  return (
    <p
      className="text-white/90 text-[14px] leading-relaxed font-light text-center max-w-sm italic"
      style={{ letterSpacing: '0.015em', textShadow: '0 0 20px hsla(280,100%,70%,0.4)' }}
    >
      “{shown}{shown.length < text.length && <span className="opacity-40 animate-pulse">▌</span>}”
    </p>
  );
}