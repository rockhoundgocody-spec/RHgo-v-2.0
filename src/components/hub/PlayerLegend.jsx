import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Upload, Trophy, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LEVEL_TITLES = [
  'Pebble Scout',
  'Crystal Apprentice',
  'Geode Guardian',
  'Titan Rockhound',
  'Legendary Specimen Hunter',
  'Mythic Earth Wizard',
];

const XP_PER_LEVEL = 1200;

function getLevel(xp) {
  return Math.min(Math.floor(xp / XP_PER_LEVEL) + 1, LEVEL_TITLES.length);
}

function getTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

function xpProgress(xp) {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}

function xpToNext(xp) {
  const level = getLevel(xp);
  if (level >= LEVEL_TITLES.length) return 0;
  return level * XP_PER_LEVEL - xp;
}

// Level-up celebration overlay
function LevelUpModal({ title, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      style={{ background: 'hsla(260,80%,5%,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="text-center px-8 py-10 rounded-3xl"
        style={{ background: 'linear-gradient(135deg, hsla(265,80%,12%,0.97), hsla(280,60%,8%,0.99))', border: '1px solid hsla(280,100%,70%,0.4)', boxShadow: '0 0 60px hsla(280,100%,60%,0.35)' }}
      >
        <div className="text-5xl mb-3">🏆</div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-amethyst-glow mb-1">Level Up!</div>
        <div className="text-white font-black text-2xl mb-1">{title}</div>
        <div className="text-white/40 text-xs">You are officially a legend.</div>
      </motion.div>
    </motion.div>
  );
}

export default function PlayerLegend({ userEmail, onXPUpdate }) {
  const storageKey = `rhgo_player_${userEmail || 'anon'}`;
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [levelUpTitle, setLevelUpTitle] = useState(null);

  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : { totalXP: 0, avatarUrl: null, badges: [] };
    } catch {
      return { totalXP: 0, avatarUrl: null, badges: [] };
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(player));
  }, [player, storageKey]);

  const level = getLevel(player.totalXP);
  const title = getTitle(level);
  const progress = xpProgress(player.totalXP);
  const remaining = xpToNext(player.totalXP);
  const nextTitle = getTitle(level + 1);

  // Expose addXP globally so DailyRoulette + ARRockBattle can call it
  useEffect(() => {
    window.__rhgo_addXP = (amount) => {
      setPlayer(prev => {
        const oldLevel = getLevel(prev.totalXP);
        const newXP = prev.totalXP + amount;
        const newLevel = getLevel(newXP);
        const leveledUp = newLevel > oldLevel;
        const newTitle = getTitle(newLevel);
        const updated = {
          ...prev,
          totalXP: newXP,
          badges: leveledUp
            ? [...prev.badges, { title: newTitle, earnedAt: new Date().toISOString() }]
            : prev.badges,
        };
        if (leveledUp) setLevelUpTitle(newTitle);
        if (onXPUpdate) onXPUpdate(newXP, leveledUp, newTitle);
        return updated;
      });
    };
    return () => { window.__rhgo_addXP = undefined; };
  }, [onXPUpdate]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPlayer(prev => ({ ...prev, avatarUrl: file_url }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        className="rounded-3xl p-4 border"
        style={{
          background: 'hsla(240,30%,8%,0.85)',
          borderColor: 'hsla(195,100%,60%,0.2)',
          boxShadow: '0 0 40px -10px hsla(260,80%,60%,0.18)',
        }}
      >
        {/* Top row: avatar + stats + upload */}
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition active:scale-95"
            style={{
              borderColor: level > 2 ? 'hsla(280,90%,65%,0.6)' : 'hsla(255,30%,40%,0.4)',
              background: 'hsla(260,40%,12%,0.8)',
              boxShadow: level > 2 ? '0 0 18px hsla(280,90%,65%,0.3)' : 'none',
            }}
            title="Upload avatar"
          >
            {player.avatarUrl ? (
              <img src={player.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="absolute inset-0 m-auto text-white/25" />
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'hsla(240,30%,5%,0.7)' }}>
                <div className="w-4 h-4 border-2 border-amethyst/40 border-t-amethyst-glow rounded-full animate-spin" />
              </div>
            )}
            {/* Camera badge */}
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-tl-lg flex items-center justify-center"
              style={{ background: 'hsla(240,30%,15%,0.9)' }}>
              <Upload size={9} className="text-white/50" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

          {/* Level + XP */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] uppercase tracking-[0.25em] text-white/40">LVL {level}</span>
              <span className="text-[9px] px-2 py-px rounded-full font-semibold"
                style={{ background: 'hsla(280,60%,20%,0.5)', color: 'hsl(280,80%,75%)', border: '1px solid hsla(280,60%,50%,0.25)' }}>
                {title}
              </span>
            </div>
            <div className="text-xl font-black text-white tracking-tight leading-none">
              {player.totalXP.toLocaleString()} <span className="text-sm text-amethyst-glow font-bold">XP</span>
            </div>
            {remaining > 0 && (
              <div className="text-[9px] text-white/30 mt-0.5">{remaining} XP → {nextTitle}</div>
            )}
          </div>
        </div>

        {/* XP Progress bar */}
        <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-1">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, hsl(265,80%,55%), hsl(280,100%,75%))' }}
          />
        </div>
        <div className="text-[8px] text-right text-white/25 mb-3">{Math.floor(progress)}% to next rank</div>

        {/* Recent badges */}
        {player.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {player.badges.slice(-4).map((b, i) => (
              <div key={i} className="flex items-center gap-1 text-[8px] px-2 py-0.5 rounded-full"
                style={{ background: 'hsla(45,80%,15%,0.4)', border: '1px solid hsla(45,80%,45%,0.25)', color: '#fbbf24' }}>
                <Trophy size={8} /> {b.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Level-up modal */}
      <AnimatePresence>
        {levelUpTitle && (
          <LevelUpModal title={levelUpTitle} onClose={() => setLevelUpTitle(null)} />
        )}
      </AnimatePresence>
    </>
  );
}