import React from 'react';
import { motion } from 'framer-motion';

/** Hero specimen photo — slow push-in, breathing glow, and a periodic caustic light sweep. */
export default function HeroPhoto({ src }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 24, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-xs lg:max-w-lg mb-8"
    >
      <motion.div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(159,232,208,0.22), rgba(232,170,80,0.08) 60%, transparent)' }}
        animate={{ opacity: [0.55, 1, 0.55], scale: [0.97, 1.03, 0.97] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 60px -10px rgba(159,232,208,0.18), 0 20px 60px -20px rgba(0,0,0,0.8)' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.img
          src={src}
          alt="Amethyst crystal specimen"
          className="w-full h-auto block"
          animate={{ scale: [1.02, 1.09, 1.02] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-y-0 -left-1/2 w-1/2 pointer-events-none mix-blend-screen"
          style={{ background: 'linear-gradient(100deg, transparent, rgba(255,226,170,0.28), rgba(159,232,208,0.18), transparent)' }}
          animate={{ x: ['0%', '400%'] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4.5, ease: [0.45, 0, 0.2, 1], delay: 1.6 }}
        />
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }} />
        <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0a0a14)' }} />
      </motion.div>
    </motion.div>
  );
}