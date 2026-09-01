import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Award, Zap, Shield, Volume2, Smile } from 'lucide-react';
import { getKidFriendlyMineral } from '@/lib/kidFriendlyData';
import { playOrbChime, triggerOrbHaptic } from '@/lib/orbAudio';

export default function JuniorExplorerCard({
  mineralName,
  isKidMode,
  onToggleMode,
}) {
  const kidData = getKidFriendlyMineral(mineralName);
  if (!kidData) return null;

  const handlePlaySound = () => {
    triggerOrbHaptic('heavy');
    playOrbChime(528); // 528 Hz miracle chime
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative rounded-3xl p-4 overflow-hidden text-white shadow-xl"
      style={{
        background: 'linear-gradient(145deg, hsl(270 50% 22%) 0%, hsl(280 60% 12%) 100%)',
        border: '2px solid hsla(45,100%,55%,0.5)',
        boxShadow: '0 12px 35px -8px hsla(280,80%,40%,0.4), 0 0 25px hsla(45,100%,50%,0.15)',
      }}
    >
      {/* Playful background stars */}
      <div className="absolute top-2 right-2 text-2xl opacity-40 select-none">✨</div>
      <div className="absolute bottom-2 left-2 text-2xl opacity-20 select-none">🦖</div>

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/25 border border-amber-400/50 text-[10px] font-black tracking-wider uppercase text-amber-300 shadow-sm">
          <Award size={13} className="animate-bounce" />
          <span>Junior Explorer Card</span>
        </div>

        {/* 1-Tap Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            triggerOrbHaptic('tap');
            onToggleMode?.();
          }}
          className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition active:scale-95 text-white/80"
          title="Switch between Kid Mode and Pro Mode"
        >
          {isKidMode ? '🎒 Kid View ON' : '🔬 Switch to Kid View'}
        </button>
      </div>

      {/* Fun Nickname & Star Trophy */}
      <div className="space-y-1 mb-3">
        <h3 className="text-lg font-black text-amber-300 tracking-tight flex items-center gap-2">
          {kidData.fun_name}
        </h3>
        <div className="text-xs font-bold text-amber-200/90 tracking-wide">
          {kidData.trophy}
        </div>
      </div>

      {/* Superpower Highlight */}
      <div
        className="rounded-2xl p-3 mb-2.5 space-y-1"
        style={{
          background: 'hsla(280,60%,15%,0.8)',
          border: '1px solid hsla(45,90%,60%,0.3)',
        }}
      >
        <div className="text-[11px] font-black text-amber-400 flex items-center gap-1.5">
          <Zap size={13} className="text-yellow-400 fill-yellow-400" />
          <span>ROCK SUPERPOWER</span>
        </div>
        <div className="text-xs font-black text-white">{kidData.superpower}</div>
        <p className="text-[11px] text-white/80 leading-relaxed">{kidData.power_desc}</p>
      </div>

      {/* Prehistoric Dinosaur Age Badge */}
      <div
        className="rounded-2xl p-2.5 mb-2.5 flex items-center gap-2.5"
        style={{
          background: 'hsla(160,50%,15%,0.6)',
          border: '1px solid hsla(160,60%,40%,0.3)',
        }}
      >
        <span className="text-xl shrink-0">🦖</span>
        <div className="text-[11px] font-bold text-emerald-200 leading-tight">
          {kidData.age_badge}
        </div>
      </div>

      {/* Secret Detective Clue */}
      <div
        className="rounded-2xl p-3 space-y-1"
        style={{
          background: 'hsla(210,60%,15%,0.6)',
          border: '1px solid hsla(210,70%,50%,0.3)',
        }}
      >
        <div className="text-[10px] uppercase font-black tracking-wider text-sky-300 flex items-center gap-1.5">
          <span>🕵️ SECRET DETECTIVE CLUE</span>
        </div>
        <p className="text-[11px] text-white/85 leading-relaxed font-medium">
          {kidData.detective_secret}
        </p>
      </div>

      {/* Victory Sound Button */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handlePlaySound}
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 transition active:scale-95"
        >
          <Volume2 size={12} /> Play Discovery Chime 🔔
        </button>
      </div>
    </motion.div>
  );
}
