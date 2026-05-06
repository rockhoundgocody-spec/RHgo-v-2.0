import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { cn } from '@/lib/utils';

/**
 * LiquidCrystalBadge
 * 
 * Rarity-reactive badge display with dynamic visual effects.
 * Common → Uncommon → Rare → Epic → Legendary
 * 
 * Props:
 *   - code: string (e.g., 'first_find')
 *   - title: string (e.g., 'First Find')
 *   - rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
 *   - icon: lucide icon name or component
 *   - earned_at: ISO date string
 *   - isNew: boolean (triggers unlock animation)
 *   - onClick: callback
 */
export default function LiquidCrystalBadge({
  code = 'badge',
  title = 'Badge',
  rarity = 'common',
  icon: IconComponent = null,
  earned_at = null,
  isNew = false,
  onClick = null,
}) {
  const prefersReducedMotion = useReducedMotion();
  const [showParticles, setShowParticles] = useState(isNew);

  useEffect(() => {
    if (isNew && !prefersReducedMotion) {
      setShowParticles(true);
      const timer = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isNew, prefersReducedMotion]);

  // Rarity configuration
  const rarityConfig = {
    common: {
      bg: 'from-slate-400 to-slate-600',
      glow: 'shadow-[0_0_20px_hsla(220,10%,40%,0.4)]',
      pulse: 'opacity-60',
      pulseScale: 1.02,
      border: 'border-slate-500/40',
      particleColor: 'bg-slate-300',
    },
    uncommon: {
      bg: 'from-emerald-400 to-emerald-600',
      glow: 'shadow-[0_0_25px_hsla(160,80%,50%,0.5)]',
      pulse: 'opacity-75',
      pulseScale: 1.03,
      border: 'border-emerald-400/50',
      particleColor: 'bg-emerald-300',
    },
    rare: {
      bg: 'from-blue-400 to-blue-600',
      glow: 'shadow-[0_0_30px_hsla(200,100%,60%,0.6)]',
      pulse: 'opacity-80',
      pulseScale: 1.04,
      border: 'border-blue-400/60',
      particleColor: 'bg-blue-300',
    },
    epic: {
      bg: 'from-purple-400 to-purple-700',
      glow: 'shadow-[0_0_35px_hsla(280,100%,70%,0.7)]',
      pulse: 'opacity-90',
      pulseScale: 1.05,
      border: 'border-purple-400/70',
      particleColor: 'bg-purple-300',
    },
    legendary: {
      bg: 'from-yellow-300 via-orange-400 to-rose-500',
      glow: 'shadow-[0_0_40px_hsla(30,100%,70%,0.8),0_0_60px_hsla(280,100%,70%,0.5)]',
      pulse: 'opacity-100',
      pulseScale: 1.06,
      border: 'border-yellow-300/80',
      particleColor: 'bg-yellow-200',
    },
  };

  const config = rarityConfig[rarity] || rarityConfig.common;

  // Animation variants
  const containerVariants = {
    idle: { scale: 1 },
    pulse: {
      scale: [1, config.pulseScale, 1],
      transition: { duration: 2, repeat: Infinity },
    },
    unlocking: {
      scale: [0.8, 1.15, 1],
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const glowVariants = {
    idle: { opacity: 0.5 },
    pulse: {
      opacity: [0.5, 0.8, 0.5],
      transition: { duration: 2, repeat: Infinity },
    },
    unlocking: { opacity: [0, 1, 0.7] },
  };

  const particleVariants = {
    initial: { opacity: 1, scale: 1 },
    exit: {
      opacity: 0,
      scale: 0,
      y: -50,
      transition: { duration: 0.8 },
    },
  };

  if (prefersReducedMotion) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'relative flex flex-col items-center gap-2 p-4 rounded-2xl',
          'border transition-colors',
          'bg-gradient-to-br',
          config.bg,
          config.border,
          'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2'
        )}
        aria-label={`Badge: ${title}`}
      >
        {IconComponent && <IconComponent size={32} className="text-white" />}
        <span className="text-xs font-bold text-white text-center max-w-[60px]">{title}</span>
      </button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-2xl',
        'border transition-colors',
        'bg-gradient-to-br',
        config.bg,
        config.border,
        'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'focus:ring-amethyst focus:ring-offset-background'
      )}
      variants={containerVariants}
      initial="idle"
      animate={isNew ? 'unlocking' : 'pulse'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Badge: ${title}${isNew ? ' (newly earned)' : ''}`}
    >
      {/* Glow layer */}
      <motion.div
        className={cn('absolute inset-0 rounded-2xl', config.glow, 'pointer-events-none')}
        variants={glowVariants}
        initial="idle"
        animate={isNew ? 'unlocking' : 'pulse'}
      />

      {/* Badge content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {IconComponent && (
          <IconComponent size={32} className="text-white drop-shadow-lg" />
        )}
        <span className="text-xs font-bold text-white text-center max-w-[60px] drop-shadow">
          {title}
        </span>
      </div>

      {/* Particle system (unlock animation) */}
      <AnimatePresence>
        {showParticles &&
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className={cn(
                'absolute w-2 h-2 rounded-full',
                config.particleColor,
                'pointer-events-none'
              )}
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 60,
                y: Math.sin((i / 8) * Math.PI * 2) * 60,
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
              }}
              variants={particleVariants}
              exit="exit"
            />
          ))}
      </AnimatePresence>

      {/* "New" indicator */}
      {isNew && (
        <motion.div
          className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}