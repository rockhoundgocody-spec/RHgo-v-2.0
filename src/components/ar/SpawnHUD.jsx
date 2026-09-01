/**
 * SpawnHUD — compact top-right spawn counter + AR mode button on Explore map.
 */
import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpawnHUD({ spawns = [], arActive, onToggleAR }) {
  return (
    <div className="flex items-center gap-2">
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