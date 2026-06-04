import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PATHS = {
  chattel: {
    icon: '⛏️',
    title: 'Claim as Chattel',
    subtitle: 'Add to My Hoard',
    description: 'You took it. It\'s yours. Your shelf, your glory.',
    bonus: '+15% Hoard Power',
    color: '#f59e0b',
    border: 'hsla(38,90%,55%,0.5)',
    bg: 'hsla(38,80%,20%,0.35)',
    glow: 'hsla(38,90%,55%,0.35)',
    badgeLabel: 'COLLECTOR',
    badgeColor: '#f59e0b',
  },
  affixed: {
    icon: '🌍',
    title: 'Log as Affixed',
    subtitle: 'Steward of the Vein',
    description: 'Left in place. Pinned to the map. Yours forever, for everyone.',
    bonus: '+15% Atlas Karma',
    color: '#34d399',
    border: 'hsla(160,70%,45%,0.5)',
    bg: 'hsla(160,60%,12%,0.35)',
    glow: 'hsla(160,70%,45%,0.35)',
    badgeLabel: 'STEWARD',
    badgeColor: '#34d399',
  },
};

export default function ClaimPathModal({ open, onChoose, onClose, isFragileSite = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              background: 'linear-gradient(160deg, hsla(270,30%,10%,0.95) 0%, hsla(240,25%,6%,0.98) 100%)',
              border: '1px solid hsla(270,40%,50%,0.25)',
              boxShadow: '0 0 60px hsla(270,80%,30%,0.5), 0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 text-white/30 hover:text-white/70 transition"
            >
              <X size={16} />
            </button>

            <div className="p-5 pb-2 text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst/60 mb-1">Choose Your Path</div>
              <div className="text-white font-bold text-lg leading-tight">How do you claim this find?</div>
              {isFragileSite && (
                <div className="mt-2 text-[10px] text-amber-400/80 bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  ⚠️ Fragile site detected — consider leaving it for future explorers
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 p-4">
              {Object.entries(PATHS).map(([key, path]) => (
                <button
                  key={key}
                  onClick={() => onChoose(key)}
                  className="relative flex flex-col items-center text-center rounded-xl p-4 transition-all active:scale-[0.96] hover:brightness-110"
                  style={{
                    background: path.bg,
                    border: `1px solid ${path.border}`,
                    boxShadow: `0 0 20px -6px ${path.glow}`,
                  }}
                >
                  {/* Suggested badge for affixed on fragile sites */}
                  {isFragileSite && key === 'affixed' && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold"
                      style={{ background: path.color, color: '#0a0a0a' }}
                    >
                      Suggested
                    </div>
                  )}

                  <div className="text-4xl mb-2 leading-none">{path.icon}</div>
                  <div className="font-bold text-white text-sm leading-tight">{path.title}</div>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-0.5"
                    style={{ color: path.color }}
                  >
                    {path.subtitle}
                  </div>
                  <p className="text-white/50 text-[10px] mt-2 leading-relaxed">{path.description}</p>
                  <div
                    className="mt-3 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${path.color}22`, color: path.color, border: `1px solid ${path.color}44` }}
                  >
                    {path.bonus}
                  </div>
                </button>
              ))}
            </div>

            <div className="px-4 pb-4 text-center text-[10px] text-white/25 leading-relaxed">
              Both paths earn XP, badges & Atlas contributions.<br/>You decide. The Earth remembers either way.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}