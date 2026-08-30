/**
 * IntroCinematic — the Orb backstory, an interactive tap-to-advance narrative.
 *
 * Flow:
 *   0  Splash      → tap to begin (initialises audio)
 *   1  The Void    → tap to advance
 *   2  The Orb's Purpose
 *   3  The Shattering
 *   4  The Call
 *   5  Name Input  → orb asks the player's name, saved to user profile
 *   6  The Player's Role → orb uses the name, asks for help
 *   7  The Choice  → "I'm in" / "Tell me more"
 *   8  Tutorial    → optional 3-step primer (identify / collect / trade)
 *
 * Each story scene requires a tap to advance (not auto-playing). A subtle
 * "TAP TO CONTINUE" prompt pulses at the bottom. Progress dots track position.
 * A small "Skip >>" button sits bottom-left. A mute toggle sits top-right.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useIntroAudio } from '@/hooks/useIntroAudio';

// ── Scene definitions ───────────────────────────────────────────────────────
const SCENES = [
  {
    id: 'void',
    text: 'Before the earth was formed, there was only the void… and the Orb.',
    bg: 'radial-gradient(ellipse at 50% 50%, hsl(250 40% 5%) 0%, hsl(240 30% 2%) 100%)',
    orbOpacity: 0.25,
    orbSize: 14,
  },
  {
    id: 'purpose',
    text: 'The Orb was the first mineral — the seed of all stones. It held the knowledge of every crystal, every gem, every rock that would ever form.',
    bg: 'radial-gradient(ellipse at 50% 45%, hsl(280 50% 14%) 0%, hsl(250 35% 5%) 100%)',
    orbOpacity: 0.75,
    orbSize: 80,
  },
  {
    id: 'shatter',
    text: 'But the Orb could not contain its knowledge alone. It shattered, scattering its fragments across the world — buried in mountains, hidden in rivers, trapped in lava.',
    bg: 'radial-gradient(ellipse at 50% 40%, hsl(265 60% 16%) 0%, hsl(245 40% 6%) 100%)',
    orbOpacity: 1,
    orbSize: 100,
    shatter: true,
  },
  {
    id: 'call',
    text: 'Now the fragments call out. They want to be found. They want to be known. They want to come home.',
    bg: 'radial-gradient(ellipse at 50% 60%, hsl(250 40% 9%) 0%, hsl(240 30% 3%) 100%)',
    orbOpacity: 0,
    orbSize: 0,
    fragments: true,
  },
];

const ROLE_BG = 'radial-gradient(ellipse at 50% 55%, hsl(280 45% 16%) 0%, hsl(250 35% 5%) 100%)';
const DEFAULT_BG = 'radial-gradient(ellipse at 50% 50%, hsl(265 50% 12%) 0%, hsl(245 35% 4%) 100%)';

const TUTORIAL_STEPS = [
  { emoji: '📷', title: 'Identify', body: 'Point your camera at any rock or mineral. Clover analyses colour, texture, and crystal structure to tell you what you found.' },
  { emoji: '💎', title: 'Collect', body: 'Every find enters your GeoDex — a living record with GPS, rarity, weather, and field notes. Your collection has real provenance.' },
  { emoji: '🤝', title: 'Trade', body: 'List specimens on the Market and trade with other collectors. Every trade links back to the original find.' },
];

const SKIP_LABEL = 'Skip >>';

// ── Starfield (generated once) ──────────────────────────────────────────────
function useStars(count) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.5 + Math.random() * 1.5,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      })),
    [count]
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function IntroCinematic({ onDone }) {
  const [step, setStep] = useState(0); // 0=splash, 1-4=scenes, 5=name, 6=role, 7=choice, 8=tutorial
  const [name, setName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [orbPulse, setOrbPulse] = useState(0);
  const audio = useIntroAudio();
  const stars = useStars(60);

  const finish = useCallback(() => {
    localStorage.setItem('rhgo_intro_seen', '1');
    onDone();
  }, [onDone]);

  const handleSplash = useCallback(() => {
    audio.initAudio();
    audio.playChime();
    setStep(1);
  }, [audio]);

  const handleSceneTap = useCallback(() => {
    if (step >= 1 && step <= 4) {
      audio.playClick();
      setOrbPulse((p) => p + 1);
      setStep((s) => s + 1);
    } else if (step === 6) {
      audio.playClick();
      setStep(7);
    }
  }, [step, audio]);

  const handleNameSubmit = useCallback(() => {
    const trimmed = nameInput.trim().slice(0, 30);
    if (!trimmed) return;
    setName(trimmed);
    audio.playChime();
    base44.auth.updateMe({ full_name: trimmed }).catch(() => {});
    setStep(6);
  }, [nameInput, audio]);

  const handleChoice = useCallback(
    (choice) => {
      audio.playWhoosh();
      if (choice === 'in') finish();
      else setStep(8);
    },
    [audio, finish]
  );

  const handleTutorialNext = useCallback(() => {
    audio.playClick();
    if (tutorialStep < TUTORIAL_STEPS.length - 1) setTutorialStep((s) => s + 1);
    else finish();
  }, [tutorialStep, audio, finish]);

  const handleSkip = useCallback(() => {
    audio.playWhoosh();
    finish();
  }, [audio, finish]);

  // ── Derived render flags ──
  const isSplash = step === 0;
  const isStory = step >= 1 && step <= 4;
  const isName = step === 5;
  const isRole = step === 6;
  const isChoice = step === 7;
  const isTutorial = step === 8;
  const scene = isStory ? SCENES[step - 1] : null;
  const showTapPrompt = isStory || isRole;
  const showDots = step >= 1 && step <= 7;
  const showSkip = step >= 1 && step <= 7;
  const dotIndex = step - 1;
  const bgStyle = scene ? scene.bg : isRole ? ROLE_BG : isName || isChoice || isTutorial ? DEFAULT_BG : 'radial-gradient(ellipse at 50% 50%, hsl(250 40% 5%) 0%, hsl(240 30% 2%) 100%)';

  return (
    <motion.div
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* ── Background ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${Math.min(step, 7)}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          style={{ background: bgStyle }}
        />
      </AnimatePresence>

      {/* ── Starfield (splash + first two scenes) ── */}
      {(isSplash || step <= 2) && (
        <div className="absolute inset-0 pointer-events-none">
          {stars.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* ── Shatter particles (scene 3) ── */}
      {step === 3 && <ShatterEffect />}

      {/* ── Underground fragments (scene 4) ── */}
      {step === 4 && <FragmentField />}

      {/* ── Central Orb (story scenes) ── */}
      {scene && scene.orbSize > 0 && (
        <motion.div
          className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ scale: orbPulse ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: scene.orbOpacity, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-full"
            style={{
              width: scene.orbSize,
              height: scene.orbSize,
              background:
                'radial-gradient(circle at 35% 35%, hsl(280 100% 92%) 0%, hsl(270 90% 70%) 40%, hsl(265 80% 45%) 70%, transparent 100%)',
              boxShadow: `0 0 ${scene.orbSize * 0.8}px hsla(280, 100%, 70%, 0.6), 0 0 ${scene.orbSize * 1.5}px hsla(265, 90%, 50%, 0.3)`,
            }}
          />
        </motion.div>
      )}

      {/* ── Role scene orb (smaller, floating) ── */}
      {isRole && (
        <motion.div
          className="absolute left-1/2 top-[33%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full"
            style={{
              width: 60,
              height: 60,
              background:
                'radial-gradient(circle at 35% 35%, hsl(280 100% 92%) 0%, hsl(270 90% 70%) 40%, hsl(265 80% 45%) 70%, transparent 100%)',
              boxShadow: '0 0 40px hsla(280, 100%, 70%, 0.5)',
            }}
          />
        </motion.div>
      )}

      {/* ── Tap layer (story + role scenes) ── */}
      {(isStory || isRole) && (
        <div data-testid="intro-tap-layer" className="absolute inset-0 cursor-pointer" onClick={handleSceneTap} />
      )}

      {/* ── Scene text ── */}
      {(scene || isRole) && (
        <div className="absolute bottom-[22%] inset-x-0 flex justify-center px-8 z-10 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 0.85, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-white/85 text-[15px] leading-relaxed font-light text-center max-w-sm"
              style={{ letterSpacing: '0.02em' }}
            >
              {isRole
                ? `I am what remains of the Orb. I need your help, ${name}. Will you help me find my fragments?`
                : scene.text}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* ── Splash ── */}
      {isSplash && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleSplash}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.4, 0.2], scale: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-full mb-8"
            style={{
              width: 20,
              height: 20,
              background: 'radial-gradient(circle, hsl(280 100% 90%) 0%, hsl(270 90% 60%) 60%, transparent 100%)',
              boxShadow: '0 0 30px hsla(280, 100%, 70%, 0.6)',
            }}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-white/50 text-[13px] tracking-[0.3em] uppercase font-light"
          >
            Tap to begin
          </motion.p>
        </div>
      )}

      {/* ── Name input ── */}
      {isName && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-sm flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="rounded-full"
              style={{
                width: 70,
                height: 70,
                background:
                  'radial-gradient(circle at 35% 35%, hsl(280 100% 92%) 0%, hsl(270 90% 70%) 40%, hsl(265 80% 45%) 70%, transparent 100%)',
                boxShadow: '0 0 50px hsla(280, 100%, 70%, 0.5)',
              }}
            />
            <p className="text-white/85 text-[15px] leading-relaxed font-light text-center">
              Welcome, traveler. What shall I call you?
            </p>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); }}
              maxLength={30}
              placeholder="Your name…"
              autoFocus
              className="w-full px-5 py-4 rounded-2xl text-white text-center text-base font-medium outline-none placeholder:text-white/25"
              style={{
                background: 'hsla(255, 30%, 12%, 0.7)',
                border: '1px solid hsla(280, 80%, 65%, 0.4)',
                boxShadow: '0 0 24px hsla(280, 80%, 50%, 0.15), inset 0 1px 0 hsla(280, 80%, 90%, 0.1)',
                backdropFilter: 'blur(12px)',
              }}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleNameSubmit}
              disabled={!nameInput.trim()}
              className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, hsla(280, 80%, 50%, 0.8), hsla(265, 70%, 40%, 0.9))',
                boxShadow: '0 0 30px hsla(280, 80%, 50%, 0.3)',
                border: '1px solid hsla(280, 80%, 65%, 0.4)',
              }}
            >
              Continue
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* ── Choice ── */}
      {isChoice && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-sm flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="rounded-full"
              style={{
                width: 80,
                height: 80,
                background:
                  'radial-gradient(circle at 35% 35%, hsl(280 100% 92%) 0%, hsl(270 90% 70%) 40%, hsl(265 80% 45%) 70%, transparent 100%)',
                boxShadow: '0 0 60px hsla(280, 100%, 70%, 0.5)',
              }}
            />
            <p className="text-white/85 text-[16px] leading-relaxed font-light text-center">
              Will you help me find my fragments, {name}?
            </p>
            <div className="w-full space-y-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChoice('in')}
                className="w-full h-14 rounded-2xl text-white font-bold text-base"
                style={{
                  background: 'linear-gradient(135deg, hsla(280, 80%, 50%, 0.85), hsla(265, 70%, 40%, 0.9))',
                  boxShadow: '0 0 30px hsla(280, 80%, 50%, 0.35)',
                  border: '1px solid hsla(280, 80%, 65%, 0.5)',
                }}
              >
                I'm in
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChoice('more')}
                className="w-full h-14 rounded-2xl text-white/80 font-semibold text-base"
                style={{
                  background: 'hsla(255, 30%, 14%, 0.6)',
                  border: '1px solid hsla(255, 30%, 40%, 0.3)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                Tell me more
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Tutorial ── */}
      {isTutorial && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={tutorialStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm flex flex-col items-center text-center gap-5"
            >
              <div className="text-6xl">{TUTORIAL_STEPS[tutorialStep].emoji}</div>
              <h2 className="text-2xl font-black text-white">{TUTORIAL_STEPS[tutorialStep].title}</h2>
              <p className="text-white/65 text-[15px] leading-relaxed">{TUTORIAL_STEPS[tutorialStep].body}</p>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-16 w-full max-w-sm px-8 flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === tutorialStep ? 24 : 6,
                    background: i === tutorialStep ? 'hsl(280, 80%, 65%)' : 'hsla(0,0%,100%,0.2)',
                  }}
                />
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleTutorialNext}
              className="w-full h-14 rounded-2xl text-white font-bold text-base"
              style={{
                background: 'linear-gradient(135deg, hsla(280, 80%, 50%, 0.85), hsla(265, 70%, 40%, 0.9))',
                boxShadow: '0 0 30px hsla(280, 80%, 50%, 0.3)',
                border: '1px solid hsla(280, 80%, 65%, 0.4)',
              }}
            >
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? 'Next' : 'Start Rockhounding!'}
            </motion.button>
          </div>
        </div>
      )}

      {/* ── TAP TO CONTINUE prompt ── */}
      {showTapPrompt && (
        <motion.div
          className="absolute bottom-[12%] inset-x-0 flex justify-center z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-light">
            Tap to continue
          </span>
        </motion.div>
      )}

      {/* ── Progress dots ── */}
      {showDots && (
        <div className="absolute bottom-[6%] inset-x-0 flex justify-center gap-2 z-10 pointer-events-none">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === dotIndex ? 20 : 6, opacity: i === dotIndex ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
              style={{ background: i <= dotIndex ? 'hsl(280, 80%, 65%)' : 'hsla(0,0%,100%,0.15)' }}
            />
          ))}
        </div>
      )}

      {/* ── Skip button ── */}
      {showSkip && (
        <button
          onClick={handleSkip}
          className="absolute bottom-4 left-4 z-20 text-white/25 text-[11px] tracking-wider hover:text-white/50 transition select-none"
          style={{ touchAction: 'manipulation' }}
        >
          {SKIP_LABEL}
        </button>
      )}

      {/* ── Mute toggle ── */}
      {step > 0 && (
        <button
          onClick={audio.toggleMute}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition"
          style={{ background: 'hsla(255, 30%, 12%, 0.5)', border: '1px solid hsla(255, 30%, 30%, 0.2)' }}
          aria-label={audio.muted ? 'Unmute' : 'Mute'}
        >
          {audio.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </motion.div>
  );
}

// ── Shatter effect (scene 3) ────────────────────────────────────────────────
function ShatterEffect() {
  const fragments = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 150 + Math.random() * 200;
        return {
          id: i,
          tx: Math.cos(angle) * distance,
          ty: Math.sin(angle) * distance,
          size: 3 + Math.random() * 6,
          delay: Math.random() * 0.3,
          color:
            i % 3 === 0 ? 'hsl(280, 100%, 85%)' : i % 3 === 1 ? 'hsl(195, 100%, 80%)' : 'hsl(45, 90%, 75%)',
        };
      }),
    []
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative" style={{ width: 100, height: 100 }}>
        {fragments.map((f) => (
          <motion.div
            key={f.id}
            className="absolute rounded-full"
            style={{ width: f.size, height: f.size, background: f.color, boxShadow: `0 0 8px ${f.color}` }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: f.tx, y: f.ty, opacity: [0, 1, 0], scale: [0, 1, 0.3] }}
            transition={{ duration: 1.5, delay: f.delay, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Fragment field (scene 4) ─────────────────────────────────────────────────
function FragmentField() {
  const fragments = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 20 + Math.random() * 60,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fragments.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size,
            height: f.size,
            background: 'radial-gradient(circle, hsl(280, 100%, 85%) 0%, hsl(270, 80%, 50%) 50%, transparent 100%)',
          }}
          animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}