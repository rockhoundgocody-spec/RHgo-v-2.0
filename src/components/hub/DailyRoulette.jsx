import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Zap, Timer, CheckCircle2, Share2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

const MEME_CAPTIONS = [
  "just vibin' with minerals 💎",
  "geologist era unlocked 🪨",
  "rocks > people, change my mind",
  "my rock collection > your rock collection",
  "found it!! chaos mode activated ⚡",
  "rockhound in the wild 🔍",
  "the grind never stops (literally, it's a rock)",
];

function getDailyChallenge() {
  const d = new Date();
  const idx = (d.getDate() * 7 + d.getMonth() * 13) % CHALLENGES.length;
  return CHALLENGES[idx];
}

function MemeCard({ challenge, onClose }) {
  const caption = MEME_CAPTIONS[new Date().getDate() % MEME_CAPTIONS.length];

  const handleShare = async () => {
    const text = `${challenge.emoji} Daily Rock Challenge: "${challenge.text}" +${challenge.xp} XP earned! ${challenge.sticker}\n\n"${caption}"\n\nPlay RockHound GO 🪨`;
    if (navigator.share) {
      await navigator.share({ title: 'RockHound GO Daily Win!', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard! 📋');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'hsla(240,30%,5%,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, hsla(280,80%,15%,0.95) 0%, hsla(30,80%,12%,0.95) 100%)', border: '2px solid hsla(280,80%,55%,0.4)' }}
      >
        {/* Meme header */}
        <div className="relative px-6 pt-8 pb-4 text-center"
          style={{ background: 'linear-gradient(180deg, hsla(30,90%,50%,0.15) 0%, transparent 100%)' }}>
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none rounded-sm">
            <X size={16} />
          </button>
          <div className="text-6xl mb-3">{challenge.emoji}</div>
          <div className="text-white font-black text-lg leading-tight mb-1">{challenge.sticker}</div>
          <div className="text-white/60 text-xs italic">"{caption}"</div>
        </div>

        {/* Challenge recap */}
        <div className="mx-4 mb-4 rounded-2xl p-3 text-center"
          style={{ background: 'hsla(280,50%,10%,0.5)', border: '1px solid hsla(280,80%,55%,0.2)' }}>
          <div className="text-white/80 text-xs font-semibold mb-1">{challenge.text}</div>
          <div className="text-yellow-400 font-black text-xl">+{challenge.xp} XP</div>
        </div>

        {/* Watermark */}
        <div className="text-center text-[9px] text-white/20 uppercase tracking-[0.3em] pb-3">
          RockHound GO · Chaos Mode
        </div>

        {/* Share button */}
        <div className="px-4 pb-6">
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            style={{ background: 'linear-gradient(135deg, hsl(280,80%,55%), hsl(30,90%,50%))', color: 'white', boxShadow: '0 4px 20px -4px hsla(280,80%,55%,0.5)' }}
          >
            <Share2 size={15} /> Share This Win!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DailyRoulette() {
  const [spinning, setSpinning] = useState(false);
  const [override, setOverride] = useState(null);
  const [showMeme, setShowMeme] = useState(false);
  const [claimed, setClaimed] = useState(() => {
    return sessionStorage.getItem(`roulette_claimed_${new Date().toDateString()}`) === '1';
  });
  const spinRef = useRef(null);

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
    spinRef.current = interval;
  };

  const claim = async () => {
    sessionStorage.setItem(`roulette_claimed_${new Date().toDateString()}`, '1');
    setClaimed(true);

    // Sync XP to companion profile
    try {
      const user = await base44.auth.me();
      if (user?.email) {
        const companions = await base44.entities.Companion.filter({ owner_email: user.email });
        if (companions.length > 0) {
          const c = companions[0];
          const newXp = (c.xp || 0) + challenge.xp;
          const newLevel = Math.floor(newXp / 500) + 1;
          await base44.entities.Companion.update(c.id, {
            xp: newXp,
            level: Math.max(c.level || 1, newLevel),
          });
        }
      }
    } catch (_) {}

    // Award XP to PlayerLegend
    if (window.__rhgo_addXP) window.__rhgo_addXP(challenge.xp);

    // Show meme share card after a beat
    setTimeout(() => setShowMeme(true), 400);
  };

  return (
    <>
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
                <button onClick={() => setShowMeme(true)} aria-label="Share" className="ml-1 text-white/40 hover:text-white/70 transition focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none rounded-sm">
                  <Share2 size={11} />
                </button>
              </div>
            ) : (
              <button onClick={claim}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-none"
                style={{ background: 'hsla(30,90%,45%,0.3)', border: '1px solid hsla(30,90%,55%,0.4)', color: '#fb923c' }}>
                ✓ I Found It! Claim XP
              </button>
            )}
            <button
              onClick={spin}
              disabled={spinning || claimed}
              aria-label="Spin for new challenge"
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-amethyst/50 focus-visible:outline-none"
              style={{ background: 'hsla(270,60%,20%,0.4)', border: '1px solid hsla(270,60%,45%,0.3)', color: 'hsl(280,80%,75%)' }}>
              <Dices size={13} className={spinning ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMeme && <MemeCard challenge={challenge} onClose={() => setShowMeme(false)} />}
      </AnimatePresence>
    </>
  );
}