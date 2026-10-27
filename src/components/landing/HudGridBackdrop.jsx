import React from 'react';
import { motion } from 'framer-motion';

export default function HudGridBackdrop() {
  return (
    <div aria-hidden className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div className="absolute -inset-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(159,232,208,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(159,232,208,.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, transparent 25%, #000 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 25%, #000 75%)',
        }}
        animate={{ x: [0, 64], y: [0, 64] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 760, height: 760, border: '1px dashed rgba(159,232,208,.12)' }}
        animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 900, height: 900, border: '1px solid rgba(255,190,90,.07)' }}
        animate={{ rotate: -360, scale: [1, 1.03, 1] }} transition={{ rotate: { duration: 140, repeat: Infinity, ease: 'linear' }, scale: { duration: 8, repeat: Infinity } }} />
    </div>
  );
}