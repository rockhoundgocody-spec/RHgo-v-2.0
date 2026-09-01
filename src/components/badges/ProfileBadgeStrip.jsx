/**
 * ProfileBadgeStrip — Compact horizontal earned-badge row for profile/collection screens
 * Shows up to 5 most recently earned badges; tapping opens the Badges page.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ChevronRight } from 'lucide-react';
import LiquidMineralBadge from './LiquidMineralBadge.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function ProfileBadgeStrip() {
  const navigate = useNavigate();
  const { earnedCodes, allBadges } = useBadgeAwarder();

  const earned = allBadges
    .filter((b) => earnedCodes.has(b.code))
    .slice(0, 5);

  const total = allBadges.length;
  const count = earnedCodes.size;

  const handleClick = () => navigate('/badges');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <GlassPanel
      role="button"
      tabIndex={0}
      aria-label="View all earned badges"
      className="px-4 py-3 cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 rounded-2xl"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Award size={13} className="text-amethyst-glow" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold">Badges</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/35 font-mono">{count}/{total}</span>
          <ChevronRight size={12} className="text-white/25" />
        </div>
      </div>

      {earned.length === 0 ? (
        <p className="text-white/30 text-xs italic">No badges earned yet — start exploring!</p>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {earned.map((b) => (
            <div key={b.code} className="flex-shrink-0">
              <LiquidMineralBadge badge={b} size={44} locked={false} />
            </div>
          ))}
          {count > 5 && (
            <div
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[10px] font-bold text-white/50"
              style={{ background: 'hsla(265,40%,20%,0.6)', border: '1px solid hsla(280,60%,50%,0.25)' }}
            >
              +{count - 5}
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}