/**
 * CloverReunion — the returning-user greeting.
 *
 * Shown on every fresh app open AFTER the first hatching. Clover is already
 * alive and remembers the user. The greeting adapts to how long they've been
 * together (days), how many times they've opened the app (opens), and the
 * time of day — so the orb feels like it grows with them.
 *
 * Brief (~3s), warm, non-blocking. Tap to skip.
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import IntroOrb from '@/components/hub/IntroOrb.jsx';

const TIME_LABEL = (h) => h < 5 ? 'these small hours' : h < 12 ? 'the morning' : h < 17 ? 'the afternoon' : h < 21 ? 'the evening' : 'the night';

function pickGreeting(bond) {
  const days = bond.daysTogether ?? 0;
  const opens = bond.opens ?? 1;
  const hour = new Date().getHours();
  const t = TIME_LABEL(hour);

  // The orb remembers who you are
  let n = null;
  try {
    const raw = localStorage.getItem('rhgo_intro_identity');
    if (raw) n = JSON.parse(raw)?.name;
  } catch {}
  const named = n ? `${n}, ` : '';

  if (opens >= 100) return `${named}our ${opens}th journey. I know your footsteps by heart now.`;
  if (days >= 30)    return `${named}${days} days, and you still surprise me. What did the earth give us this ${t}?`;
  if (days >= 7)     return `${named}${days} days in, and I can feel when you're near. What are we hunting this ${t}?`;
  if (days >= 3)     return `${n ? n + ', ' : ''}day ${days} together. We're finding our rhythm — show me something new.`;
  if (days >= 1)     return `${named}a new day, ${days} in. I've been waiting in the dark for you.`;
  if (opens > 1)     return `${named}you came back. I hoped you would.`;
  return `${n ? n + ', ' : ''}there you are. I've been waiting in the dark for you.`;
}

export default function CloverReunion({ bond, onDone }) {
  const [leaving, setLeaving] = useState(false);
  const [greeting, setGreeting] = useState('');
  const { speak, stop } = useSpeechSynthesis();
  const voiceEnabled = localStorage.getItem('rhgo_clover_voice') !== 'off';
  const timer = useRef();
  const spokenRef = useRef(false);

  useEffect(() => {
    const line = pickGreeting(bond);
    setGreeting(line);
    if (voiceEnabled) {
      // small delay so the orb settles before speaking
      const t = setTimeout(() => {
        if (spokenRef.current) return;
        spokenRef.current = true;
        stop();
        speak(line, { voice: 'honey' });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [bond, speak, stop, voiceEnabled]);

  useEffect(() => {
    timer.current = setTimeout(() => setLeaving(true), 3200);
    return () => { clearTimeout(timer.current); stop(); };
  }, [stop]);

  useEffect(() => {
    if (leaving) {
      stop();
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [leaving, onDone, stop]);

  const skip = () => setLeaving(true);

  const level = Math.min(5, bond.bondLevel ?? 1);
  const hour = new Date().getHours();
  const nightTint = hour < 6 || hour >= 21;

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="clover-reunion"
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onClick={skip}
        >
          {/* Warm backdrop */}
          <div className="absolute inset-0" style={{
            background: nightTint
              ? 'radial-gradient(ellipse 80% 60% at 50% 42%, hsl(265 55% 16%) 0%, hsl(250 38% 8%) 100%)'
              : 'radial-gradient(ellipse 85% 65% at 50% 42%, hsl(280 58% 18%) 0%, hsl(262 45% 11%) 45%, hsl(250 35% 6%) 100%)',
          }} />
          <motion.div className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(circle at 50% 42%, hsla(280,100%,55%,0.55) 0%, transparent 55%)' }} />

          {/* Orb — already alive, calm, breathing */}
          <div className="relative flex items-center justify-center mb-8" style={{ width: 160, height: 160 }}>
            {/* Bond-level ring pips — grow with the relationship */}
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full border"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: i < level ? 0.25 : 0.08, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                style={{ width: 90 + i * 22, height: 90 + i * 22, borderColor: i < level ? 'hsla(280,100%,75%,0.4)' : 'hsla(280,30%,50%,0.2)' }} />
            ))}

            <IntroOrb size={120} />
          </div>

          {/* Wordmark */}
          <motion.div className="absolute top-[8%] inset-x-0 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <div className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em', textShadow: '0 0 40px hsla(280,100%,75%,0.5)' }}>
              RockHound<span style={{ color: 'hsl(280,100%,88%)' }}> GO</span>
            </div>
          </motion.div>

          {/* Greeting */}
          <div className="absolute bottom-[18%] inset-x-0 flex flex-col items-center px-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
              className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <motion.span className="w-1.5 h-1.5 rounded-full bg-amethyst-glow" animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                <span className="text-[9px] uppercase tracking-[0.4em] text-amethyst-glow/70 font-semibold">Clover · day {(bond.daysTogether ?? 0) + 1}</span>
              </div>
              <p className="text-white/90 text-[15px] leading-relaxed font-light text-center max-w-sm italic"
                style={{ letterSpacing: '0.015em', textShadow: '0 0 20px hsla(280,100%,70%,0.4)' }}>
                {greeting}
              </p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-4 text-white/15 text-[9px] tracking-[0.3em] uppercase">
            Tap to continue
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}