import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { Flame, Zap, Star } from 'lucide-react';

const CHAIN_MILESTONES = [
  { days: 1,   label: '1 Day',    emoji: '🔥' },
  { days: 3,   label: '3 Days',   emoji: '🔥🔥' },
  { days: 7,   label: '1 Week',   emoji: '⚡' },
  { days: 14,  label: '2 Weeks',  emoji: '💎' },
  { days: 30,  label: '1 Month',  emoji: '👑' },
  { days: 100, label: '100 Days', emoji: '🌋' },
];

function getNextMilestone(streak) {
  return CHAIN_MILESTONES.find((m) => m.days > streak) || CHAIN_MILESTONES[CHAIN_MILESTONES.length - 1];
}

function getPrevMilestone(streak) {
  const passed = CHAIN_MILESTONES.filter((m) => m.days <= streak);
  return passed[passed.length - 1] || null;
}

export default function DiscoveryChain({ streak = 0 }) {
  const next = getNextMilestone(streak);
  const prev = getPrevMilestone(streak);
  const pct = prev
    ? Math.min(((streak - prev.days) / (next.days - prev.days)) * 100, 100)
    : Math.min((streak / next.days) * 100, 100);

  // Build visual chain nodes
  const nodes = CHAIN_MILESTONES.slice(0, 6);

  return (
    <GlassPanel className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={13} className="text-orange-400" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-orange-300 font-bold">
              Discovery Chain
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-yellow-400" />
            <span className="text-yellow-300 font-bold text-xs tabular-nums">{streak}</span>
            <span className="text-white/30 text-[9px]">day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Chain nodes */}
        <div className="flex items-center gap-0 mb-3">
          {nodes.map((node, i) => {
            const reached = streak >= node.days;
            const isCurrent = prev?.days === node.days || (!prev && i === 0 && streak > 0);
            return (
              <React.Fragment key={node.days}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                      reached
                        ? 'border-orange-400 bg-orange-500/20 shadow-[0_0_12px_hsla(30,100%,50%,0.5)]'
                        : 'border-white/10 bg-white/3'
                    }`}
                  >
                    {reached ? node.emoji.split('').slice(-1)[0] : <span className="text-white/20 text-xs">○</span>}
                  </div>
                  <span className={`text-[7px] uppercase tracking-wider text-center leading-none ${reached ? 'text-orange-300' : 'text-white/20'}`}>
                    {node.label.split(' ')[0]}
                  </span>
                </div>
                {i < nodes.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-0.5 ${streak > node.days ? 'bg-orange-400/60' : 'bg-white/8'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress to next */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-white/40">{streak > 0 ? `${streak} days logged` : 'Start your chain today!'}</span>
            {streak < next.days && (
              <span className="text-orange-300/70">{next.days - streak}d to {next.emoji} {next.label}</span>
            )}
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #fb923c, #f59e0b)' }}
            />
          </div>
        </div>

        {streak === 0 && (
          <p className="mt-2 text-[10px] text-white/30 italic text-center">
            Scan a specimen today to start your chain 🪨
          </p>
        )}
        {streak >= 7 && (
          <p className="mt-2 text-[10px] text-orange-300/60 text-center font-semibold">
            ⚡ You're on fire! Don't break the chain!
          </p>
        )}
      </div>
    </GlassPanel>
  );
}