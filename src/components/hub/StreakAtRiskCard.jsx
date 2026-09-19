import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Urgent streak card — only when they have a streak and haven't checked in today.
 */
export default function StreakAtRiskCard({ companion }) {
  if (!companion) return null;
  const streak = Number(companion.streak_days) || 0;
  if (streak < 2) return null;
  if (companion.last_check_in_date === todayKey()) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsla(15,90%,28%,0.45), hsla(280,60%,18%,0.55))',
        border: '1px solid hsla(20,100%,60%,0.35)',
        boxShadow: '0 0 32px -8px hsla(20,100%,50%,0.35)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none hub-shimmer-overlay" />
      <div className="relative flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'hsla(20,100%,50%,0.2)', border: '1px solid hsla(20,100%,60%,0.45)' }}>
          <Flame size={20} className="text-orange-300" style={{ filter: 'drop-shadow(0 0 8px hsla(20,100%,60%,0.8))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-orange-200 font-bold text-sm">{streak}-day streak at risk</div>
          <p className="text-white/55 text-[11px] mt-0.5">Check in with Clover before midnight or it resets.</p>
        </div>
        <Link
          to="/companion"
          className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider"
          style={{ background: '#9FE8D0', color: '#0a0a14' }}
        >
          Save it
        </Link>
      </div>
    </motion.div>
  );
}
