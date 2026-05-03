import React from 'react';
import { Heart, Flame, Sparkles } from 'lucide-react';

const moodLabels = {
  radiant: 'Radiant ✨',
  happy: 'Happy',
  calm: 'Calm',
  drowsy: 'Drowsy',
  tender: 'Tender',
};

/**
 * Small pet-status strip that sits under the orb — shows level, energy bar,
 * streak. Finch-style: warm, never punishing.
 */
export default function CompanionStatus({ companion }) {
  if (!companion) return null;
  const energy = Math.max(0, Math.min(100, companion.energy ?? 0));
  const moodLabel = moodLabels[companion.mood] || 'Calm';

  return (
    <div className="mt-10 flex items-center justify-center gap-3 flex-wrap text-[12px]">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel border border-amethyst/30 text-amethyst-glow">
        <Sparkles size={12} />
        <span className="font-mono uppercase tracking-wider">
          Lv {companion.level} · {moodLabel}
        </span>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-emerald-400/20">
        <Heart size={12} className="text-emerald-300" />
        <div className="w-16 h-1.5 rounded-full bg-emerald-950/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-700"
            style={{ width: `${energy}%` }}
          />
        </div>
        <span className="text-emerald-200/90 font-mono text-[10px]">{energy}</span>
      </div>

      {companion.streak_days > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel border border-amber-400/30 text-amber-200">
          <Flame size={12} />
          <span className="font-mono uppercase tracking-wider">
            {companion.streak_days}d streak
          </span>
        </div>
      )}
    </div>
  );
}