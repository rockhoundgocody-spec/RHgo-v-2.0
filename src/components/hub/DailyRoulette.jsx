import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Zap, Timer, CheckCircle2 } from 'lucide-react';

const CHALLENGES = [
  { emoji: '✨', text: 'Find something that sparkles within 500ft', xp: 500, sticker: '🌟 Holographic Star', difficulty: 'easy' },
  { emoji: '🔴', text: 'Spot any red or orange mineral today', xp: 350, sticker: '🔥 Fire Badge', difficulty: 'easy' },
  { emoji: '💧', text: 'Find a rock near water — creek, pond, or puddle', xp: 400, sticker: '💧 Stream Scout', difficulty: 'easy' },
  { emoji: '🧲', text: 'Pick up 3 different rock types in one trip', xp: 600, sticker: '⚡ Triple Finder', difficulty: 'medium' },
  { emoji: '🌈', text: 'Photograph a mineral with 2+ colors', xp: 450, sticker: '🌈 Rainbow Rock', difficulty: 'easy' },
  { emoji: '💎', text: 'Find a crystal — any size counts!', xp: 750, sticker: '💎 Crystal Chaser', difficulty: 'hard' },
  { emoji: '🕵️', text: 'Identify a rock by its streak color alone', xp: 550, sticker: '🕵️ Mineral Detective', difficulty: 'medium' },
  { emoji: '🦕', text: 'Look for anything that might be fossilized', xp: 800, sticker: '🦕 Time Traveler', difficulty: 'hard' },
  { emoji: '⚫', text: 'Find the darkest rock you can — black as night', xp: 300, sticker: '🌑 Shadow Stone', difficulty: 'easy' },
  { emoji: '🪨', text: 'Find a rock bigger than your fist', xp: 250, sticker: '💪 Boulder Brain', difficulty: 'easy' },
];

const DIFFICULTY_STYLE = {
  easy:   { color: '#34d399', label: 'Easy',   bg: 'hsla(145,60%,20%,0.3)', border: 'hsla(145,60%,45%,0.3)' },
  medium: { color: '#fbbf24', label: 'Medium', bg: 'hsla(45,90%,20%,0.3)',  border: 'hsla(45,90%,50%,0.3)' },
  hard:   { color: '#f87171', label: 'Hard',   bg: 'hsla(0,80%,25%,0.3)',   border: 'hsla(0,80%,55%,0.3)' },
};

function getDailyChallenge() {
  const d = new Date();
  const idx = (d.getDate() * 7 + d.getMonth() * 13) % CHALLENGES.length;
  return CHALLENGES[idx];
}

export default function DailyRoulette() {
  const [spinning, setSpinning] = useState(false);
  const [override, setOverride] = useState(null);
  const [claimed, setClaimed] = useState(() => {
    return sessionStorage.getItem(`roulette_claimed_${new Date().toDateString()}`) === '1';
  });

  const challenge = override || getDailyChallenge();
  const diff = DIFFICULTY_STYLE[challenge.difficulty];

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setOverride(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 80);
  };

  const claim = () => {
    sessionStorage.setItem(`roulette_claimed_${new Date().toDateString()}`, '1');
    setClaimed(true);
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'hsla(30,60%,8%,0.6)', border: '1px solid hsla(30,80%,45%,0.25)', boxShadow: '0 4px 24px -8px hsla(30,90%,50%,0.2)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Dices size={14} className="text-orange-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-400/80">Daily Rock Roulette</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-white/25">
          <Timer size={9} />
          <span>Resets at midnight</span>
        </div>
      </div>

      {/* Challenge card */}
      <div className="px-4 pb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={challenge.text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="rounded-xl p-4 mb-3"
            style={{ background: diff.bg, border: `1px solid ${diff.border}` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0 leading-none">{challenge.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-[0.3em] px-2 py-0.5 rounded-full"
                    style={{ background: `${diff.color}18`, color: diff.color, border: `1px solid ${diff.color}30` }}>
                    {diff.label}
                  </span>
                </div>
                <p className="text-white/90 text-sm font-semibold leading-snug">{challenge.text}</p>
              </div>
            </div>

            {/* Reward */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={11} className="text-yellow-400" />
                <span className="text-sm font-black text-yellow-400">+{challenge.xp} XP</span>
              </div>
              <span className="text-[10px] text-white/40">{challenge.sticker}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 pb-4">
          {claimed ? (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-emerald-400 text-xs font-bold"
              style={{ background: 'hsla(145,60%,15%,0.4)', border: '1px solid hsla(145,60%,40%,0.3)' }}>
              <CheckCircle2 size={13} /> Challenge Claimed!
            </div>
          ) : (
            <button onClick={claim}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95"
              style={{ background: 'hsla(30,90%,45%,0.3)', border: '1px solid hsla(30,90%,55%,0.4)', color: '#fb923c' }}>
              ✓ I Found It! Claim XP
            </button>
          )}
          <button
            onClick={spin}
            disabled={spinning || claimed}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'hsla(270,60%,20%,0.4)', border: '1px solid hsla(270,60%,45%,0.3)', color: 'hsl(280,80%,75%)' }}>
            <Dices size={13} className={spinning ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}