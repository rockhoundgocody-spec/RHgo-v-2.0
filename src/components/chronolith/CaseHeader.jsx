import React from 'react';
import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';

export default function CaseHeader({ hypothesesCount, contradictionsCount, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-1"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'hsla(270,60%,30%,0.3)', border: '1px solid hsla(270,80%,60%,0.3)' }}
      >
        <Scale size={16} className="text-amethyst-glow" />
      </div>
      <div className="flex-1">
        <h2 className="text-base font-black text-white tracking-tight leading-none">Reality Trial</h2>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-0.5">
          {hypothesesCount} competing histories · {contradictionsCount} contradictions
        </p>
      </div>
      <button
        onClick={onReset}
        className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60 transition px-2 py-1 rounded-lg border border-white/10"
      >
        New Case
      </button>
    </motion.div>
  );
}
