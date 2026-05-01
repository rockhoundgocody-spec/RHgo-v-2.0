import React, { useState } from 'react';
import { Award, Lock } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import LiquidCrystalBadge from '@/components/badges/LiquidCrystalBadge.jsx';
import BadgeUnlockOverlay from '@/components/badges/BadgeUnlockOverlay.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';

const RARITY_LABEL = {
  common: 'text-white/60 border-white/15',
  uncommon: 'text-emerald-300 border-emerald-400/30',
  rare: 'text-sky-300 border-sky-400/30',
  epic: 'text-amethyst-glow border-amethyst/40',
  legendary: 'text-amber-300 border-amber-400/40',
};

export default function Badges() {
  const { earnedCodes, pendingBadge, dismissPending, allBadges } = useBadgeAwarder();
  const [selected, setSelected] = useState(null);

  const earnedCount = allBadges.filter((b) => earnedCodes.has(b.code)).length;

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Badges</h1>
        <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">
          Achievements
        </p>
      </div>

      <GlassPanel className="mb-6">
        <div className="grid grid-cols-2 divide-x divide-white/10 text-center py-4">
          <div>
            <div className="text-2xl font-bold text-white glow-amethyst">{earnedCount}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amethyst/60 mt-1">
              Earned
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white/70">{allBadges.length - earnedCount}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amethyst/60 mt-1">
              Locked
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-2 gap-4">
        {allBadges.map((b) => {
          const earned = earnedCodes.has(b.code);
          return (
            <GlassPanel key={b.code} className="p-4">
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => earned && setSelected(b)}
              >
                <LiquidCrystalBadge
                  rarity={b.rarity}
                  icon={b.icon}
                  size={110}
                  locked={!earned}
                />
                <div className="text-white text-sm font-semibold mt-3 text-center truncate w-full">
                  {b.title}
                </div>
                <div
                  className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1.5 ${
                    RARITY_LABEL[b.rarity]
                  }`}
                >
                  {earned ? b.rarity : 'locked'}
                </div>
                <p className="text-white/50 text-[11px] mt-2 text-center leading-snug">
                  {earned ? b.description : '???'}
                </p>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {earnedCount === 0 && (
        <div className="mt-8 text-center text-white/50 text-sm">
          <Award className="mx-auto mb-2 text-amethyst/40" />
          Log specimens to start unlocking badges.
        </div>
      )}

      {/* Auto-trigger overlay for newly-earned badges */}
      {pendingBadge && (
        <BadgeUnlockOverlay badge={pendingBadge} onClose={dismissPending} />
      )}

      {/* Manual replay when tapping an earned badge */}
      {selected && (
        <BadgeUnlockOverlay badge={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}