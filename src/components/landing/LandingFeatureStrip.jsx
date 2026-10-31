import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine, MapPinned, Gem } from 'lucide-react';

const FEATURES = [
  { icon: ScanLine, title: 'AI ID', sub: 'From one photo' },
  { icon: MapPinned, title: 'Land status', sub: 'Before you dig' },
  { icon: Gem, title: 'Geo-DEX', sub: 'Every find logged' },
];

export default function LandingFeatureStrip() {
  return (
    <div className="w-full max-w-xs lg:max-w-md grid grid-cols-3 gap-2 mb-8">
      {FEATURES.map((f, i) => (
        <motion.div key={f.title}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.0 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl px-2 py-3 flex flex-col items-center text-center border border-white/10 bg-white/[0.04] backdrop-blur-md"
        >
          <motion.div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5"
            style={{ background: 'rgba(159,232,208,0.12)' }}
            animate={{ boxShadow: ['0 0 0px rgba(159,232,208,0)', '0 0 18px rgba(159,232,208,0.45)', '0 0 0px rgba(159,232,208,0)'] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}>
            <f.icon className="w-4.5 h-4.5" style={{ color: '#9FE8D0', width: 18, height: 18 }} />
          </motion.div>
          <span className="text-white text-[12px] font-bold leading-tight">{f.title}</span>
          <span className="text-white/60 text-[10px] leading-tight mt-0.5">{f.sub}</span>
        </motion.div>
      ))}
    </div>
  );
}