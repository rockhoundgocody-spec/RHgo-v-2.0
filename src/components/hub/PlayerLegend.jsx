/* eslint-disable unused-imports/no-unused-imports */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Upload, Trophy, Zap, Share2, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { shareAchievement } from '@/lib/shareAchievement';

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
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [levelUpTitle, setLevelUpTitle] = useState(null);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [player, setPlayer] = useState({ totalXP: 0, avatarUrl: null, badges: [] });

  // Load profile from backend on mount
  useEffect(() => {
    base44.functions.invoke('getPlayerProfile', {})
      .then(res => {
        const p = res.data;
        if (p) setPlayer({ totalXP: p.total_xp || 0, avatarUrl: p.avatar_url || null, badges: p.badges || [] });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userEmail]);

  const level = getLevel(player.totalXP);
  const title = getTitle(level);
  const progress = xpProgress(player.totalXP);
  const remaining = xpToNext(player.totalXP);
  const nextTitle = getTitle(level + 1);

  // Expose addXP globally so DailyRoulette + ARRockBattle can call it
  useEffect(() => {
    window.__rhgo_addXP = async (amount, reason = 'XP awarded') => {
      try {
        const res = await base44.functions.invoke('awardXP', { amount, reason });
        const result = res.data;
        if (result) {
          const oldLevel = getLevel(player.totalXP);
          setPlayer(prev => ({ ...prev, totalXP: result.newXP, badges: result.badges || prev.badges }));
          base44.analytics.track({ eventName: 'player_xp_gained', properties: { amount, total_xp: result.newXP, level: result.newLevel } });
          if (result.leveledUp) {
            const newTitle = getTitle(result.newLevel);
            base44.analytics.track({ eventName: 'player_level_up', properties: { old_level: oldLevel, new_level: result.newLevel, title: newTitle } });
            setLevelUpTitle(newTitle);
          }
          if (onXPUpdate) onXPUpdate(result.newXP, result.leveledUp, getTitle(result.newLevel));
        }
      } catch { /* non-critical */ }
    };
    return () => { window.__rhgo_addXP = undefined; };
  }, [player.totalXP, onXPUpdate]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPlayer(prev => ({ ...prev, avatarUrl: file_url }));
      // Persist avatar to PlayerProfile
      const profiles = await base44.entities.PlayerProfile.filter({ owner_email: userEmail }, '-created_date', 1);
      if (profiles[0]) await base44.entities.PlayerProfile.update(profiles[0].id, { avatar_url: file_url });
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async () => {
    base44.analytics.track({ eventName: 'legend_shared', properties: { xp: player.totalXP, level } });
    const result = await shareAchievement({ rank: title, xp: player.totalXP });
    if (result === 'clipboard') {
      setShared('copied');
      setTimeout(() => setShared(false), 2400);
    } else if (result === 'error') {
      setShared('error');
      setTimeout(() => setShared(false), 2400);
    } else {
      setShared(false);
    }
  };

  return (
    <>
      <div
        className="rounded-3xl overflow-hidden border"
        style={{
          background: 'linear-gradient(160deg, hsla(265,40%,10%,0.95) 0%, hsla(240,30%,7%,0.95) 100%)',
          borderColor: 'hsla(280,60%,50%,0.22)',
          boxShadow: '0 0 40px -10px hsla(265,80%,55%,0.22)',
        }}
      >
        {/* Header label — tappable, navigates to profile */}
        <Link to="/profile" className="flex items-center justify-between px-4 pt-4 pb-3 border-b"
          style={{ borderColor: 'hsla(280,40%,40%,0.15)' }}>
          <div className="flex items-center gap-2">
            <Trophy size={13} className="text-amethyst-glow" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amethyst-glow/70">Your Legend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 px-2 py-0.5 rounded-full border border-white/15">
              Level {level}
            </span>
            <ChevronRight size={12} className="text-white/30" />
          </div>
        </Link>

        <div className="p-4">
          {/* Avatar + stats row */}
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar — tap navigates to profile, upload button is separate */}
            <div className="relative flex-shrink-0">
              <Link to="/profile"
                className="block w-16 h-16 rounded-2xl overflow-hidden border-2 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50 focus-visible:ring-offset-2 ring-offset-background"
                style={{
                  borderColor: level > 2 ? 'hsla(280,90%,65%,0.6)' : 'hsla(255,30%,50%,0.35)',
                  background: 'hsla(260,40%,12%,0.9)',
                  boxShadow: level > 2 ? '0 0 20px hsla(280,90%,65%,0.28)' : 'none',
                }}
              >
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <User size={22} className="text-white/30" />
                    <span className="text-[7px] text-white/30 uppercase tracking-wider">Profile</span>
                  </div>
                )}
              </Link>
              {/* Small upload badge */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50 focus-visible:ring-offset-1 ring-offset-background"
                style={{ background: 'hsla(265,60%,20%,0.95)', borderColor: 'hsla(280,60%,50%,0.5)' }}
                aria-label="Upload avatar"
              >
                {uploading
                  ? <div className="w-2.5 h-2.5 border border-amethyst/40 border-t-amethyst-glow rounded-full animate-spin" />
                  : <Upload size={9} className="text-amethyst-glow" />
                }
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

            {/* Rank + XP */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-lg leading-none tracking-tight mb-1">
                {title}
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl font-black text-amethyst-glow leading-none">
                  {player.totalXP.toLocaleString()}
                </span>
                <span className="text-xs text-white/40 font-semibold">XP</span>
              </div>
              {remaining > 0 ? (
                <div className="text-[9px] text-white/35">
                  {remaining.toLocaleString()} XP to unlock <span className="text-amethyst-glow/70">{nextTitle}</span>
                </div>
              ) : (
                <div className="text-[9px] text-yellow-400/70">Max rank achieved 🏆</div>
              )}
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="mb-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[8px] text-white/30 uppercase tracking-wider">Rank Progress</span>
              <span className="text-[8px] text-white/30">{Math.floor(progress)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'hsla(265,40%,20%,0.4)' }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${Math.max(progress, player.totalXP > 0 ? 2 : 0)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(90deg, hsl(265,80%,55%), hsl(280,100%,75%))' }}
              />
            </div>
          </div>

          {/* Empty state nudge */}
          {player.totalXP === 0 && (
            <p className="text-[9px] text-white/25 text-center mt-3">
              Claim a Daily Challenge or win a Rock Battle to earn your first XP ⚡
            </p>
          )}

          {/* Recent rank badges */}
          {player.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {player.badges.slice(-4).map((b, i) => (
                <div key={i} className="flex items-center gap-1 text-[8px] px-2.5 py-1 rounded-full"
                  style={{ background: 'hsla(45,80%,12%,0.5)', border: '1px solid hsla(45,80%,45%,0.3)', color: '#fbbf24' }}>
                  <Trophy size={8} /> {b.title}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <Link to="/badges"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold transition active:scale-95"
              style={{ background: 'hsla(265,50%,20%,0.7)', border: '1px solid hsla(280,60%,50%,0.3)', color: 'hsl(280,100%,90%)' }}
            >
              <Trophy size={10} /> Achievements
            </Link>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold transition active:scale-95"
              style={{ background: 'hsla(195,60%,20%,0.7)', border: '1px solid hsla(195,80%,50%,0.3)', color: 'hsl(195,100%,82%)' }}
            >
              {shared === 'copied' ? <><Check size={10} /> Copied!</>
               : shared === 'error' ? <><AlertCircle size={10} /> Try again</>
               : <><Share2 size={10} /> Share</>}
            </button>
          </div>
        </div>
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