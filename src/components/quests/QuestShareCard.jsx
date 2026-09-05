import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Sparkles, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const APP_URL = 'https://rhgo.base44.app';

const TYPE_COLOR = {
  daily: '#34d399',
  weekly: '#38bdf8',
  monthly: '#a78bfa',
};

/**
 * QuestShareCard — overlay toast shown immediately after a quest is completed.
 * Shows the quest title, XP reward, and Clover's message, with a Share button
 * that uses the Web Share API and tracks the 'quest_shared' analytics event.
 */
export default function QuestShareCard({ quests, onDismiss }) {
  const [sharing, setSharing] = useState(false);

  // Show one card at a time; the parent passes newly-completed quests.
  const quest = quests[0];
  if (!quest) return null;

  const color = TYPE_COLOR[quest.quest_type] || '#a78bfa';

  const handleShare = async () => {
    const shareText = `Just completed "${quest.title}" and earned ${quest.xp_reward} XP on RockHound-GO! 🪨 ${APP_URL}`;
    setSharing(true);

    try {
      // Track the share event
      base44.analytics.track({
        eventName: 'quest_shared',
        properties: {
          quest_type: quest.quest_type || 'daily',
          xp_reward: quest.xp_reward || 0,
        },
      });
    } catch { /* analytics is best-effort */ }

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, title: 'RockHound-GO Quest Complete' });
      } catch { /* user cancelled — no action needed */ }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
      } catch { /* clipboard may be blocked */ }
    }

    setSharing(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 pointer-events-none"
      >
        {/* Backdrop — subtle, lets the user see the map/result behind it */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onDismiss} />

        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden pointer-events-auto"
          style={{
            background: 'linear-gradient(160deg, hsla(245,25%,12%,0.96) 0%, hsla(255,30%,8%,0.98) 100%)',
            border: `1px solid ${color}40`,
            boxShadow: `0 0 40px -8px ${color}50, 0 16px 48px -12px hsla(245,50%,3%,0.8)`,
            backdropFilter: 'blur(24px) saturate(160%)',
          }}
        >
          {/* Top accent line */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

          {/* Close button */}
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition"
            style={{ background: 'hsla(0,0%,100%,0.06)' }}
          >
            <X size={14} />
          </button>

          <div className="px-5 pt-5 pb-4">
            {/* Quest type badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.3em] px-2.5 py-1 rounded-full"
                style={{ background: `${color}18`, color }}
              >
                {quest.quest_type} · Complete
              </span>
              <Sparkles size={13} style={{ color }} className="animate-pulse" />
            </div>

            {/* Quest title */}
            <h2 className="text-lg font-black text-white leading-tight mb-1">{quest.title}</h2>

            {/* XP reward */}
            <div className="flex items-center gap-1.5 mb-3">
              <Zap size={14} style={{ color }} />
              <span className="text-sm font-bold" style={{ color }}>+{quest.xp_reward} XP earned</span>
            </div>

            {/* Clover's message */}
            {quest.clover_message && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4"
                style={{ background: `${color}08`, borderLeft: `2px solid ${color}50` }}
              >
                <span className="text-base leading-none mt-0.5">🍀</span>
                <p className="text-[11px] italic text-white/55 leading-relaxed">"{quest.clover_message}"</p>
              </div>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                border: `1px solid ${color}50`,
                color: '#fff',
                boxShadow: `0 0 20px -6px ${color}40`,
              }}
            >
              <Share2 size={15} />
              {sharing ? 'Sharing…' : 'Share this win'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}