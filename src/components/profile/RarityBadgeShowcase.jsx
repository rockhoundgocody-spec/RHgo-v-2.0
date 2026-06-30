import React from 'react';
import { Gem, Sparkle, Diamond, Crown } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const RARITY_TIERS = [
  {
    code: 'rarity_common', label: 'Common', icon: Gem,
    color: 'hsl(215, 35%, 65%)', glow: 'hsla(215, 40%, 65%, 0.5)',
    gradient: 'linear-gradient(135deg, hsl(210,30%,42%), hsl(220,25%,30%))',
  },
  {
    code: 'rarity_uncommon', label: 'Uncommon', icon: Sparkle,
    color: 'hsl(152, 70%, 52%)', glow: 'hsla(152, 80%, 50%, 0.55)',
    gradient: 'linear-gradient(135deg, hsl(160,55%,40%), hsl(155,50%,28%))',
  },
  {
    code: 'rarity_rare', label: 'Rare', icon: Diamond,
    color: 'hsl(195, 100%, 68%)', glow: 'hsla(195, 100%, 60%, 0.6)',
    gradient: 'linear-gradient(135deg, hsl(190,80%,46%), hsl(200,75%,34%))',
  },
  {
    code: 'rarity_legendary', label: 'Legendary', icon: Crown,
    color: 'hsl(45, 100%, 62%)', glow: 'hsla(45, 100%, 60%, 0.7)',
    gradient: 'linear-gradient(135deg, hsl(40,85%,46%), hsl(35,80%,34%))',
  },
];

export default function RarityBadgeShowcase({ earnedCodes, rarityCounts = {} }) {
  const allEarned = RARITY_TIERS.every(t => earnedCodes?.has(t.code));

  return (
    <GlassPanel className="mb-4 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Rarity Achievements</span>
        <span className="text-[9px] text-white/30">{allEarned ? 'All tiers found' : 'Collect to unlock'}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {RARITY_TIERS.map((tier) => {
          const earned = earnedCodes?.has(tier.code);
          const count = rarityCounts[tier.label.toLowerCase()] || 0;
          const Icon = tier.icon;
          return (
            <div key={tier.code} className="flex flex-col items-center gap-1.5">
              <div className="relative" style={{ width: 50, height: 50 }}>
                {earned && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${tier.glow} 0%, transparent 65%)`,
                      animation: `badge-pulse-glow ${2.8 + (count % 3) * 0.4}s ease-in-out infinite`,
                    }}
                  />
                )}
                <div
                  className="relative w-full h-full rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{
                    background: earned ? tier.gradient : 'hsla(255,20%,18%,0.7)',
                    border: `1.5px solid ${earned ? tier.color : 'hsla(255,20%,40%,0.3)'}`,
                    boxShadow: earned ? `0 0 14px ${tier.glow}, inset 0 1px 0 hsla(0,0%,100%,0.2)` : 'none',
                    filter: earned ? 'none' : 'grayscale(0.8) brightness(0.45)',
                    opacity: earned ? 1 : 0.5,
                  }}
                >
                  <Icon size={21} strokeWidth={1.8} style={{ color: earned ? '#fff' : 'hsla(0,0%,100%,0.25)' }} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: earned ? tier.color : 'hsla(0,0%,100%,0.3)' }}>
                  {tier.label}
                </div>
                <div className="text-[8px] text-white/30">{count} found</div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}