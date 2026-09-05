/**
 * ExpeditionTeaserModal — sign-up gate shown to logged-out visitors who tap a
 * hotspot pin or the Expedition Planner button on the public Explore map.
 *
 * Message: "Sign up free to plan a multi-stop expedition to find [minerals]."
 * CTA routes to /register.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, X, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExpeditionTeaserModal({ open, onClose, minerals = [], hotspotName = null }) {
  const topMinerals = minerals.slice(0, 3).filter(Boolean);
  const mineralText = topMinerals.join(', ');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, hsla(245,32%,10%,0.99), hsla(240,26%,6%,0.99))',
              border: '1px solid hsla(270,30%,40%,0.3)',
              boxShadow: '0 12px 48px hsla(265,80%,15%,0.5)',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-white/10"
            >
              <X size={18} className="text-white/40 hover:text-white/70 transition" />
            </button>

            <div className="p-6 pt-8 text-center">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, hsla(265,70%,45%,0.3), hsla(280,80%,55%,0.3))',
                  border: '1px solid hsla(280,80%,65%,0.3)',
                }}
              >
                <Route size={24} className="text-amethyst-glow" />
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400/80 font-semibold">
                  Expedition Planner
                </span>
              </div>

              <h2 className="text-white font-bold text-lg leading-snug mb-3">
                Sign up free to plan a multi-stop expedition
              </h2>

              <p className="text-white/65 text-sm leading-relaxed mb-5">
                {mineralText ? (
                  <>
                    to find{' '}
                    <span className="text-amethyst-glow font-semibold">{mineralText}</span>
                    {hotspotName ? <> at {hotspotName}</> : null}.
                  </>
                ) : (
                  'to discover mineral hotspots near you and build your collection.'
                )}
              </p>

              {/* Mineral pills */}
              {topMinerals.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                  {topMinerals.map((m, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        background: 'hsla(265,40%,18%,0.8)',
                        border: '1px solid hsla(265,60%,50%,0.25)',
                        color: '#c084fc',
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, hsla(265,70%,45%,0.9), hsla(280,80%,55%,0.9))',
                  border: '1px solid hsla(280,80%,65%,0.4)',
                  boxShadow: '0 0 24px hsla(280,80%,50%,0.3)',
                }}
              >
                Create Free Account <ChevronRight size={16} />
              </Link>

              <button
                onClick={onClose}
                className="mt-3 text-white/40 text-xs hover:text-white/70 transition"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}