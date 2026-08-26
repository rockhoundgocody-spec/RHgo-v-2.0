/**
 * Top3BadgesStrip — Shows top 3 most recently earned badges as large 3D photorealistic orbs.
 * No descriptions. Tap any badge or "View All" to go to the full Badges page.
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import LiquidMineralBadge from './LiquidMineralBadge.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';

const RARITY_GLOW = {
  common:    'hsla(255,30%,60%,0.35)',
  uncommon:  'hsla(152,80%,45%,0.4)',
  rare:      'hsla(200,90%,55%,0.45)',
  epic:      'hsla(265,80%,60%,0.5)',
  legendary: 'hsla(45,100%,55%,0.55)',
};

// Static index mapping for O(1) rarity weight comparisons during sorting
const RARITY_INDEX = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};

export default function Top3BadgesStrip() {
  const navigate = useNavigate();
  const { earnedCodes, allBadges } = useBadgeAwarder();

  // Top 3 earned, highest rarity first
  // Performance Optimization: Memoized filter/sort with O(1) hash map rarity lookups instead of O(R) indexOf
  const top3 = useMemo(() => {
    return allBadges
      .filter((b) => earnedCodes.has(b.code))
      .sort((a, b) => (RARITY_INDEX[a.rarity] ?? 5) - (RARITY_INDEX[b.rarity] ?? 5))
      .slice(0, 3);
  }, [allBadges, earnedCodes]);

  // Pad with locked placeholders if fewer than 3 earned
  const slots = [0, 1, 2].map((i) => ({ badge: top3[i] || null, earned: !!top3[i] }));

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-6">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => navigate('/badges')}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            {slot.earned ? (
              <div
                style={{
                  filter: `drop-shadow(0 0 18px ${RARITY_GLOW[slot.badge.rarity]})`,
                  transform: i === 1 ? 'scale(1.12)' : 'scale(1)',
                }}
              >
                <LiquidMineralBadge badge={slot.badge} size={i === 1 ? 92 : 76} locked={false} />
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: i === 1 ? 92 : 76,
                  height: i === 1 ? 92 : 76,
                  background: 'hsla(265,30%,12%,0.7)',
                  border: '1px dashed hsla(265,40%,45%,0.3)',
                }}
              >
                <Lock size={18} className="text-white/20" />
              </div>
            )}
            {slot.earned && (
              <span className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: RARITY_GLOW[slot.badge.rarity].replace('0.35', '0.8').replace('0.4', '0.8').replace('0.45', '0.85').replace('0.5', '0.85').replace('0.55', '0.9') }}>
                {slot.badge.rarity}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate('/badges')}
        className="flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-white/35 hover:text-white/60 transition mt-1"
      >
        View all {allBadges.length} achievements <ChevronRight size={11} />
      </button>
    </div>
  );
}