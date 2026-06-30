/**
 * SpawnHUD — compact top-right spawn counter + AR mode button on Explore map.
 */
import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpawnHUD({ spawns = [], caughtToday, dailyCap, arActive, onToggleAR }) {
  const legendary = spawns.filter(s => s.rarity === 'legendary').length;
  const rare      = spawns.filter(s => s.rarity === 'rare').length;
  const progress  = Math.min(caughtToday / dailyCap, 1);

  return (
    <div className="flex items-center gap-2">
      {/* Daily cap bar */}
      <div className="flex flex-col items-end gap-0.5">
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

      {/* AR toggle */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onToggleAR}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all"
        style={{
          background: arActive
            ? 'linear-gradient(135deg, hsla(280,80%,40%,0.6), hsla(195,80%,30%,0.5))'
            : 'hsla(240,30%,8%,0.88)',
          border: arActive
            ? '1px solid hsla(280,80%,70%,0.5)'
            : '1px solid hsla(255,30%,40%,0.3)',
          boxShadow: arActive ? '0 0 16px hsla(280,80%,60%,0.35)' : 'none',
          backdropFilter: 'blur(20px)',
          color: arActive ? 'hsl(280,100%,88%)' : 'hsla(255,20%,70%,0.6)',
        }}
        aria-label="Toggle AR spawn mode"
      >
        <Zap size={13} />
        <span>AR</span>
        {spawns.length > 0 && (
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
            style={{ background: 'hsl(280,80%,55%)', color: '#fff' }}>
            {spawns.length}
          </span>
        )}
      </motion.button>
    </div>
  );
}