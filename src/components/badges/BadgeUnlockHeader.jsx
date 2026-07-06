import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const RARITY_LABEL = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};

export default function BadgeUnlockHeader({ badge, scheme }) {
  return (
    <motion.div
      className="flex flex-col items-center text-center px-8 mt-2"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: 0.4, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-[10px] uppercase tracking-[0.5em] mb-2 flex items-center gap-2"
        style={{ color: scheme.secondary }}>
        <Sparkles size={10} /> Badge Unlocked <Sparkles size={10} />
      </div>
      <h2 className="text-white text-[26px] font-black tracking-wide mb-1.5 leading-tight"
        style={{ textShadow: `0 0 24px ${scheme.glow}, 0 0 48px ${scheme.glow.replace('0.9','0.3')}` }}>
        {badge.title}
      </h2>
      <p className="text-white/55 text-sm max-w-[280px] leading-relaxed">{badge.description}</p>
      <div className="text-[9px] uppercase tracking-[0.35em] mt-3 px-4 py-1.5 rounded-full"
        style={{
          background: scheme.primary.replace(')', ',0.16)'),
          border: `1px solid ${scheme.rim}`,
          color: scheme.secondary,
          boxShadow: `0 0 12px ${scheme.glow.replace('0.9','0.2')}`,
        }}>
        ✦ {RARITY_LABEL[badge.rarity] || badge.rarity} ✦
      </div>
    </motion.div>
  );
}
