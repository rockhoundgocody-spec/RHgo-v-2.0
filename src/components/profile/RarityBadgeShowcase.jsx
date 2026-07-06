/**
 * RarityBadgeShowcase — Profile-page visual badge system.
 *
 * Each tier renders a full LiquidMineralBadge whose design (color scheme,
 * material, particle count, glow rings, animation speed) scales dynamically
 * with how many minerals of that rarity the user has collected.
 *
 * Tiers: Common → Uncommon → Rare → Legendary
 * Each unlocked tier shows:
 *   - Full LiquidMineralBadge at 88px
 *   - Rarity-specific animated outer ring
 *   - Count badge (# collected)
 *   - Progress label
 *   - Milestone markers at 1 / 5 / 25 / 100 finds
 */
import React, { useMemo } from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import LiquidMineralBadge from '@/components/badges/LiquidMineralBadge.jsx';
import { Lock } from 'lucide-react';

// Milestone thresholds per tier (controls visual "power level")
const MILESTONES = [1, 5, 25, 100];

// Per-tier badge definitions — colorScheme + material evolve with count
function getTierBadge(tier, count) {
  const configs = {
    common: {
      milestoneSchemes:    ['slate', 'slate', 'teal', 'ocean'],
      milestoneMaterials:  ['natural_stone', 'natural_stone', 'liquid_glass', 'geo_topo'],
      icon:       'Gem',
      label:      'Common',
      color:      'hsl(215,35%,65%)',
      glow:       'hsla(215,40%,65%,0.55)',
      ringColor:  'hsla(215,40%,65%,0.35)',
    },
    uncommon: {
      milestoneSchemes:    ['jade', 'jade', 'emerald', 'teal'],
      milestoneMaterials:  ['liquid_glass', 'liquid_glass', 'natural_stone', 'geo_topo'],
      icon:       'Sparkles',
      label:      'Uncommon',
      color:      'hsl(152,70%,52%)',
      glow:       'hsla(152,80%,50%,0.6)',
      ringColor:  'hsla(152,70%,52%,0.4)',
    },
    rare: {
      milestoneSchemes:    ['cyan', 'cyan', 'violet', 'ocean'],
      milestoneMaterials:  ['crystal_core', 'crystal_core', 'liquid_glass', 'metallic_inlay'],
      icon:       'Diamond',
      label:      'Rare',
      color:      'hsl(195,100%,68%)',
      glow:       'hsla(195,100%,60%,0.65)',
      ringColor:  'hsla(195,100%,60%,0.45)',
    },
    legendary: {
      milestoneSchemes:    ['gold', 'gold', 'amber', 'gold'],
      milestoneMaterials:  ['crystal_core', 'crystal_core', 'metallic_inlay', 'crystal_core'],
      icon:       'Crown',
      label:      'Legendary',
      color:      'hsl(45,100%,62%)',
      glow:       'hsla(45,100%,60%,0.75)',
      ringColor:  'hsla(45,100%,60%,0.5)',
    },
  };

  const cfg = configs[tier];
  // Which milestone bracket are we in?
  const bracket = MILESTONES.reduce((acc, m, i) => (count >= m ? i : acc), 0);

  return {
    ...cfg,
    code:         `rarity_${tier}`,
    title:        cfg.label,
    rarity:       tier === 'common' ? 'common' : tier === 'uncommon' ? 'uncommon' : tier === 'rare' ? 'rare' : 'legendary',
    colorScheme:  cfg.milestoneSchemes[bracket],
    material:     cfg.milestoneMaterials[bracket],
    bracket,
  };
}

// Ring animation speed + count scales with milestone bracket
const RING_CFG = {
  common:    { dur: 5.5, rings: 0, spinDur: null   },
  uncommon:  { dur: 4.2, rings: 1, spinDur: null   },
  rare:      { dur: 3.0, rings: 1, spinDur: 16     },
  legendary: { dur: 2.0, rings: 2, spinDur: 9      },
};

// Progress label for each milestone bracket
const BRACKET_LABEL = ['Starter', 'Collector', 'Expert', 'Master'];

function MilestoneBar({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {MILESTONES.map((m, i) => {
        const hit = count >= m;
        return (
          <div key={m} className="relative group">
            <div
              className="w-3 h-3 rounded-sm transition-all duration-500"
              style={{
                background: hit ? 'hsla(280,80%,65%,0.8)' : 'hsla(255,20%,30%,0.6)',
                boxShadow: hit ? '0 0 6px hsla(280,80%,65%,0.5)' : 'none',
                transform: hit ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            {/* tooltip on hover */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] bg-black/80 text-white/70 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-10">
              {m}+
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TierCard({ tier, count, earned }) {
  const badge     = getTierBadge(tier, count);
  const ringCfg   = RING_CFG[tier];
  const bracket   = badge.bracket;
  const OCT       = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
  const BADGE_SIZE = 88;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: BADGE_SIZE + 28, height: BADGE_SIZE + 28 }}>
        {/* Outer ambient glow */}
        {earned && (
          <div
            className="absolute inset-0 pointer-events-none rounded-full"
            style={{
              background: `radial-gradient(circle, ${badge.glow} 0%, transparent 65%)`,
              animation: `rbs-pulse ${ringCfg.dur}s ease-in-out infinite`,
            }}
          />
        )}

        {/* Orbit ring(s) */}
        {earned && ringCfg.rings >= 1 && (
          <div
            className="absolute pointer-events-none"
            style={{
              inset: 4,
              clipPath: OCT,
              border: `1px solid ${badge.ringColor}`,
              animation: ringCfg.spinDur ? `rbs-spin ${ringCfg.spinDur}s linear infinite` : `rbs-breathe ${ringCfg.dur * 0.9}s ease-in-out infinite`,
            }}
          />
        )}
        {earned && ringCfg.rings >= 2 && (
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -2,
              clipPath: OCT,
              border: `1.5px dashed ${badge.ringColor.replace('0.5', '0.2')}`,
              animation: ringCfg.spinDur ? `rbs-spin-rev ${ringCfg.spinDur * 1.5}s linear infinite` : `rbs-breathe ${ringCfg.dur * 1.3}s ease-in-out infinite`,
            }}
          />
        )}

        {/* The badge itself */}
        <LiquidMineralBadge
          badge={badge}
          size={BADGE_SIZE}
          locked={!earned}
          showLabel={false}
        />

        {/* Count bubble */}
        {earned && count > 0 && (
          <div
            className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center text-[9px] font-black z-10"
            style={{
              width: 22, height: 22,
              background: badge.color,
              color: '#000',
              boxShadow: `0 0 8px ${badge.glow}`,
              border: '1.5px solid rgba(0,0,0,0.35)',
            }}
          >
            {count > 99 ? '99+' : count}
          </div>
        )}

        {/* Lock icon if not earned */}
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Lock size={18} className="text-white/20" />
          </div>
        )}
      </div>

      {/* Tier label + bracket + milestone pips */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="text-[9px] font-black uppercase tracking-[0.2em]"
          style={{ color: earned ? badge.color : 'hsla(0,0%,100%,0.25)' }}
        >
          {badge.label}
        </div>

        {earned ? (
          <>
            <div
              className="text-[7px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}30` }}
            >
              {BRACKET_LABEL[bracket]}
            </div>
            <MilestoneBar count={count} />
          </>
        ) : (
          <div className="text-[7px] text-white/25 uppercase tracking-widest">Locked</div>
        )}
      </div>
    </div>
  );
}

export default function RarityBadgeShowcase({ earnedCodes, rarityCounts = {} }) {
  const tiers  = ['common', 'uncommon', 'rare', 'legendary'];
  const counts = useMemo(() => ({
    common:    rarityCounts.common    || 0,
    uncommon:  rarityCounts.uncommon  || 0,
    rare:      rarityCounts.rare      || 0,
    legendary: rarityCounts.legendary || 0,
  }), [rarityCounts]);

  const earnedCount = tiers.filter(t => earnedCodes?.has(`rarity_${t}`)).length;
  const totalFinds  = Object.values(counts).reduce((s, v) => s + v, 0);

  return (
    <GlassPanel className="mb-5 p-5">
      <style>{`
        @keyframes rbs-pulse     { 0%,100%{opacity:.5;transform:scale(1)}   50%{opacity:.9;transform:scale(1.06)} }
        @keyframes rbs-breathe   { 0%,100%{opacity:.35}                      50%{opacity:.75} }
        @keyframes rbs-spin      { from{transform:rotate(0deg)}               to{transform:rotate(360deg)} }
        @keyframes rbs-spin-rev  { from{transform:rotate(0deg)}               to{transform:rotate(-360deg)} }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Rarity Collection</span>
          <div className="text-[8px] text-white/25 mt-0.5 uppercase tracking-widest">
            {earnedCount}/{tiers.length} tiers unlocked · {totalFinds} total finds
          </div>
        </div>
        {earnedCount === tiers.length && (
          <div
            className="text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
            style={{ background: 'hsla(45,100%,50%,0.12)', color: 'hsl(45,100%,62%)', border: '1px solid hsla(45,100%,60%,0.3)' }}
          >
            ✦ Full Set
          </div>
        )}
      </div>

      {/* Tier grid */}
      <div className="grid grid-cols-4 gap-2">
        {tiers.map(tier => (
          <TierCard
            key={tier}
            tier={tier}
            count={counts[tier]}
            earned={!!(earnedCodes?.has(`rarity_${tier}`))}
          />
        ))}
      </div>

      {/* Milestone legend */}
      <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/8">
        <span className="text-[8px] text-white/25 uppercase tracking-wider shrink-0">Milestones</span>
        <div className="flex items-center gap-2">
          {MILESTONES.map((m, i) => (
            <div key={m} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsla(280,80%,65%,0.7)' }} />
              <span className="text-[7px] text-white/30">{m}+ → {BRACKET_LABEL[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}