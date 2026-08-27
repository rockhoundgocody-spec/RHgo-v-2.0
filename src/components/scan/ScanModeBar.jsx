/**
 * ScanModeBar — 2B.1 Camera / Scan Home
 * Scan mode selector (Rock/Mineral, Crystal, Fossil, Mixed Matrix),
 * lighting tips panel, and scale reference toggle.
 */
import React, { useState } from 'react';
import { Mountain, Gem, Bone, Layers, Lightbulb, Ruler, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MODES = [
  { id: 'rock',    label: 'Rock/Mineral', icon: Mountain, hint: 'Bulk rocks & hand specimens' },
  { id: 'crystal', label: 'Crystal',      icon: Gem,      hint: 'Crystal faces & terminations' },
  { id: 'fossil',  label: 'Fossil',       icon: Bone,     hint: 'Imprints & replacement structures' },
  { id: 'matrix',  label: 'Mixed Matrix', icon: Layers,   hint: 'Specimen in host rock' },
];

const LIGHTING_TIPS = [
  { icon: '☀️', text: 'Use indirect natural light — avoid harsh shadows on crystal faces' },
  { icon: '📏', text: 'Hold camera 6–12 inches from specimen for macro detail' },
  { icon: '💧', text: 'Slightly wet the surface to reveal true color and luster' },
  { icon: '🪙', text: 'Include a coin or finger for scale reference' },
  { icon: '🔄', text: 'Capture at least 2 angles: top-down and side profile' },
];

export default function ScanModeBar({ mode, onModeChange, scaleOn, onScaleToggle }) {
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Mode pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              aria-pressed={active}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
              style={{
                background: active ? 'hsla(280,80%,40%,0.35)' : 'hsla(255,30%,12%,0.6)',
                border: `1px solid ${active ? 'hsla(280,90%,65%,0.5)' : 'hsla(270,20%,30%,0.25)'}`,
                color: active ? 'hsl(280,100%,88%)' : 'hsla(0,0%,100%,0.4)',
              }}
            >
              <Icon size={11} aria-hidden="true" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Utility toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTipsOpen(true)}
          aria-expanded={tipsOpen}
          aria-controls="lighting-tips-dialog"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
          style={{
            background: 'hsla(45,80%,40%,0.15)',
            border: '1px solid hsla(45,80%,55%,0.3)',
            color: 'hsl(45,90%,70%)',
          }}
        >
          <Lightbulb size={11} aria-hidden="true" />
          Lighting Tips
        </button>

        <button
          onClick={onScaleToggle}
          aria-pressed={scaleOn}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
          style={{
            background: scaleOn ? 'hsla(195,80%,40%,0.2)' : 'hsla(255,30%,12%,0.6)',
            border: `1px solid ${scaleOn ? 'hsla(195,90%,65%,0.4)' : 'hsla(270,20%,30%,0.25)'}`,
            color: scaleOn ? 'hsl(195,100%,75%)' : 'hsla(0,0%,100%,0.4)',
          }}
        >
          <Ruler size={11} aria-hidden="true" />
          Scale Ref
        </button>
      </div>

      {/* Lighting tips sheet */}
      <AnimatePresence>
        {tipsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
            style={{ background: 'hsla(265,50%,3%,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setTipsOpen(false)}
          >
            <motion.div
              id="lighting-tips-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lighting-tips-title"
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl p-5 pb-8"
              style={{
                background: 'linear-gradient(180deg, hsla(255,35%,16%,0.98), hsla(250,30%,10%,0.99))',
                border: '1px solid hsla(270,50%,55%,0.25)',
                borderTop: '1px solid hsla(270,60%,70%,0.4)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-300" aria-hidden="true" />
                  <h3 id="lighting-tips-title" className="text-sm font-bold text-white">Lighting & Capture Tips</h3>
                </div>
                <button
                  onClick={() => setTipsOpen(false)}
                  aria-label="Close lighting tips"
                  className="text-white/30 hover:text-white/70 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-3">
                {LIGHTING_TIPS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'hsla(255,30%,12%,0.5)', border: '1px solid hsla(270,20%,25%,0.2)' }}>
                    <span className="text-lg shrink-0" aria-hidden="true">{tip.icon}</span>
                    <p className="text-white/70 text-xs leading-relaxed">{tip.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}