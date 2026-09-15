import React, { useState } from 'react';
import { motion } from 'framer-motion';
import IntroOrb from '@/components/hub/IntroOrb.jsx';

/**
 * FirstVisitGate — the very first screen a new visitor sees.
 * Asks for their name, or offers "I already have an account" to skip
 * straight to login. Shown outside the Hub for unauthenticated users.
 */
export default function FirstVisitGate({ onChoice }) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const handleBegin = () => {
    const trimmed = name.trim().slice(0, 30);
    if (!trimmed) {
      setTouched(true);
      return;
    }
    onChoice('new', trimmed);
  };

  const handleReturning = () => {
    onChoice('returning');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-8 overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, hsl(265 50% 12%) 0%, hsl(245 35% 4%) 100%)' }}
    >
      {/* Subtle starfield */}
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 1 + Math.random() * 1.5,
            height: 1 + Math.random() * 1.5,
          }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm flex flex-col items-center gap-7 relative z-10"
      >
        {/* Orb */}
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <IntroOrb size={72} />
        </motion.div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-white font-bold text-xl tracking-tight">Welcome to RockHound-GO</h1>
          <p className="text-white/50 text-[14px] font-light mt-1.5">
            What should we call you?
          </p>
        </div>

        {/* Name input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleBegin(); }}
          maxLength={30}
          placeholder="Your name…"
          autoFocus
          className="w-full px-5 py-4 rounded-2xl text-white text-center text-base font-medium outline-none placeholder:text-white/25"
          style={{
            background: 'hsla(255, 30%, 12%, 0.7)',
            border: touched && !name.trim()
              ? '1px solid hsla(0, 70%, 60%, 0.5)'
              : '1px solid hsla(280, 80%, 65%, 0.4)',
            boxShadow: '0 0 24px hsla(280, 80%, 50%, 0.15), inset 0 1px 0 hsla(280, 80%, 90%, 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        />

        {/* Begin button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleBegin}
          className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, hsla(280, 80%, 50%, 0.85), hsla(265, 70%, 40%, 0.9))',
            boxShadow: '0 0 30px hsla(280, 80%, 50%, 0.3)',
            border: '1px solid hsla(280, 80%, 65%, 0.4)',
          }}
        >
          Begin your journey
        </motion.button>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-[11px] uppercase tracking-[0.2em]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Returning user link */}
        <button
          onClick={handleReturning}
          className="text-white/55 text-[14px] font-medium hover:text-white/80 transition"
        >
          I already have an account
        </button>
      </motion.div>
    </div>
  );
}