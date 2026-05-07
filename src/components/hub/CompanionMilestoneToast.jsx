import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, X } from 'lucide-react';

/**
 * CompanionMilestoneToast
 * Shows a full-bleed animated overlay when the companion levels up or hits
 * a major XP milestone (100, 250, 500, 1000, …).
 *
 * Props:
 *   notification: { type: 'levelup' | 'milestone', level?, xp?, label } | null
 *   onDismiss: () => void
 */
export default function CompanionMilestoneToast({ notification, onDismiss }) {
  const timerRef = useRef(null);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!notification) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timerRef.current);
  }, [notification, onDismiss]);

  const isLevelUp = notification?.type === 'levelup';

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.label}
          initial={{ opacity: 0, y: -80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed top-4 left-1/2 z-[9999] -translate-x-1/2 w-[92vw] max-w-sm"
          onClick={onDismiss}
        >
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer"
            style={{
              background: isLevelUp
                ? 'linear-gradient(135deg, hsla(265,80%,20%,0.92) 0%, hsla(280,90%,12%,0.96) 100%)'
                : 'linear-gradient(135deg, hsla(195,70%,14%,0.92) 0%, hsla(215,80%,10%,0.96) 100%)',
              border: isLevelUp
                ? '1px solid hsla(280,100%,75%,0.45)'
                : '1px solid hsla(195,100%,60%,0.35)',
              boxShadow: isLevelUp
                ? '0 0 40px hsla(280,100%,60%,0.35), 0 8px 32px rgba(0,0,0,0.5)'
                : '0 0 40px hsla(195,100%,50%,0.25), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
              className="absolute inset-y-0 w-1/2 pointer-events-none"
              style={{
                background: isLevelUp
                  ? 'linear-gradient(90deg, transparent, hsla(280,100%,90%,0.12), transparent)'
                  : 'linear-gradient(90deg, transparent, hsla(195,100%,90%,0.10), transparent)',
              }}
            />

            <div className="relative flex items-center gap-4 px-5 py-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  background: isLevelUp
                    ? 'radial-gradient(circle, hsla(280,100%,75%,0.25) 0%, hsla(265,80%,35%,0.15) 100%)'
                    : 'radial-gradient(circle, hsla(195,100%,60%,0.2) 0%, hsla(215,80%,30%,0.1) 100%)',
                  border: isLevelUp
                    ? '1px solid hsla(280,100%,75%,0.4)'
                    : '1px solid hsla(195,100%,60%,0.3)',
                }}
              >
                {isLevelUp ? (
                  <Star size={26} className="text-amethyst-glow" fill="currentColor" />
                ) : (
                  <Zap size={26} className="text-hud-cyan" fill="currentColor" />
                )}
              </motion.div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 }}
                  className="text-[10px] font-mono uppercase tracking-[0.35em] mb-0.5"
                  style={{ color: isLevelUp ? 'hsl(280,100%,75%)' : 'hsl(195,100%,60%)' }}
                >
                  {isLevelUp ? 'Level Up!' : 'XP Milestone'}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.24 }}
                  className="text-white font-bold text-[17px] leading-tight truncate"
                >
                  {notification.label}
                </motion.div>
                {isLevelUp && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-amethyst/70 text-[11px] mt-0.5"
                  >
                    Amethyst grows stronger ✨
                  </motion.div>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar auto-dismiss indicator */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
              className="h-0.5 origin-left"
              style={{
                background: isLevelUp
                  ? 'linear-gradient(90deg, hsl(280,100%,75%), hsl(265,80%,50%))'
                  : 'linear-gradient(90deg, hsl(195,100%,60%), hsl(215,80%,50%))',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}