/**
 * NewUserTour — full-screen first-launch walkthrough.
 * Shown once, stored in localStorage. Clover explains every major feature.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    emoji: '🌟',
    title: 'Welcome to RockHound GO!',
    body: "Hi! I'm Clover 🍀 — your field geology companion. I'll guide you through every feature so you can start discovering amazing minerals right away.",
  },
  {
    emoji: '🔬',
    title: 'Scan & Identify',
    body: 'Point your camera at any rock or mineral. Our AI instantly identifies it, shows confidence scores, and logs it to your collection. Works on beaches, trails, and riverbeds!',
  },
  {
    emoji: '🗺️',
    title: 'Explore the Map',
    body: 'See verified hotspots near you — beaches, cliffs, and dig sites where other rockhounds have found great specimens. Tap any pin for details and directions.',
  },
  {
    emoji: '💎',
    title: 'Your Geo-DEX',
    body: 'Every specimen you scan gets saved to your personal Geo-DEX collection. View photos, identification details, GPS coordinates, and rarity ratings for everything you\'ve found.',
  },
  {
    emoji: '🗺️',
    title: 'Private Rock Log',
    body: 'Found a special spot? Save exact coordinates and photos to your Private Rock Log — completely hidden from other users. Your secret stash, forever.',
  },
  {
    emoji: '⚔️',
    title: 'Quests & Challenges',
    body: 'Complete daily and weekly quests to earn XP and unlock rare badges. Quests push you to find specific minerals, visit new hotspots, and grow as a rockhound.',
  },
  {
    emoji: '🏆',
    title: 'Leaderboard',
    body: 'Compete with the community! See who\'s found the rarest specimens and climb the leaderboard. Earn XP from every scan, quest, and verified find.',
  },
  {
    emoji: '🍀',
    title: 'Your Companion',
    body: 'Check in with me daily to keep our streak alive and boost your XP multiplier. The more you explore, the more I grow with you. Tap the orb on the Home screen to chat anytime!',
  },
  {
    emoji: '🚀',
    title: "You're Ready!",
    body: "That's everything! Tap the Scan button at the bottom to identify your first specimen. I'll be right here whenever you need me. Happy hunting! 🪨",
  },
];

const TOUR_KEY = 'rhgo_tour_seen_v1';

export default function NewUserTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9000] flex items-center justify-center px-5"
          style={{ background: 'hsla(245,30%,4%,0.88)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-3xl p-7 flex flex-col items-center text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, hsl(252 22% 13%) 0%, hsl(248 24% 8%) 100%)',
              border: '1px solid hsla(270,50%,60%,0.28)',
              boxShadow: '0 24px 80px hsla(250,60%,4%,0.85), inset 0 1px 0 hsla(270,60%,90%,0.1)',
            }}
          >
            {/* Skip */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition"
              aria-label="Skip tour"
            >
              <X size={18} />
            </button>

            {/* Emoji */}
            <div className="text-5xl mb-4 select-none">{current.emoji}</div>

            {/* Title */}
            <h2 className="text-white font-bold text-xl leading-tight mb-3">{current.title}</h2>

            {/* Body */}
            <p className="text-white/55 text-[13px] leading-relaxed mb-6">{current.body}</p>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    background: i === step
                      ? 'hsl(280,85%,75%)'
                      : i < step
                        ? 'hsla(280,60%,65%,0.45)'
                        : 'hsla(0,0%,100%,0.12)',
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 w-full">
              {step > 0 && (
                <button
                  onClick={back}
                  className="flex items-center justify-center gap-1 flex-1 py-3 rounded-2xl text-sm font-semibold text-white/50 hover:text-white/80 transition"
                  style={{ background: 'hsla(255,20%,18%,0.6)', border: '1px solid hsla(255,20%,30%,0.3)' }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center justify-center gap-1 flex-1 py-3 rounded-2xl text-sm font-bold text-white transition"
                style={{
                  background: 'linear-gradient(135deg, hsl(280 70% 55%), hsl(265 75% 45%))',
                  boxShadow: '0 4px 20px hsla(280,80%,50%,0.35)',
                }}
              >
                {isLast ? "Let's Go! 🚀" : <>Next <ChevronRight size={16} /></>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}