import React from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const RANK_COLORS = ['#fbbf24', '#94a3b8', '#cd7c4c'];

export default function BattleLeaderboard({ scores }) {
  if (!scores?.length) return null;

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ background: 'hsla(240,30%,6%,0.85)', border: '1px solid hsla(45,80%,50%,0.2)' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <Trophy size={11} className="text-yellow-400" />
        <span className="text-[8px] uppercase tracking-[0.3em] text-yellow-400/70">Your Battle Record</span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {scores.slice(0, 5).map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2"
          >
            <span className="text-[9px] font-black w-4" style={{ color: RANK_COLORS[i] || '#475569' }}>
              #{i + 1}
            </span>
            {s.avatarUrl ? (
              <img src={s.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                style={{ background: 'hsla(265,60%,25%,0.8)', border: '1px solid hsla(265,60%,50%,0.3)' }}>
                {s.emoji}
              </div>
            )}
            <span className="flex-1 text-[10px] text-white/70 truncate">{s.mineral}</span>
            <span className="text-[9px] font-bold text-yellow-400/80">+{s.xp} XP</span>
            <span className="text-[8px] text-white/25">{s.date}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}