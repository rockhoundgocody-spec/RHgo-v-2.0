/**
 * SpawnStats — compact nearby-spawn counter + daily cap bar (left-aligned).
 */
import React from 'react';

export default function SpawnStats({ spawns = [], caughtToday, dailyCap }) {
  const legendary = spawns.filter(s => s.rarity === 'legendary').length;
  const rare      = spawns.filter(s => s.rarity === 'rare').length;
  const progress  = Math.min(caughtToday / dailyCap, 1);

  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-center gap-1">
        {legendary > 0 && <span className="text-[9px]">👑×{legendary}</span>}
        {rare > 0      && <span className="text-[9px]">💎×{rare}</span>}
        <span className="text-[9px] text-white/40">{spawns.length} nearby</span>
      </div>
      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'hsla(255,20%,30%,0.5)' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${progress * 100}%`, background: progress >= 1 ? 'hsl(0,70%,55%)' : 'hsl(45,100%,55%)' }} />
      </div>
      <span className="text-[8px] text-white/30">{caughtToday}/{dailyCap} today</span>
    </div>
  );
}