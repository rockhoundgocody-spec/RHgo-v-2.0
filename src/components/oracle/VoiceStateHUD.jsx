/**
 * VoiceStateHUD — shared sci-fi status indicator used across all voice surfaces.
 * Three distinct states: listening (red/rose scan pulse), thinking (cyan spinner grid),
 * speaking (amethyst wave bars).
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Volume2, Radio } from 'lucide-react';

const STATES = {
  listening: {
    icon: Mic,
    label: 'Listening',
    color: '#f43f5e',          // rose-500
    glow: 'hsla(345,90%,58%,0.55)',
    border: 'hsla(345,90%,58%,0.4)',
    bg: 'hsla(345,80%,15%,0.6)',
    dotColor: '#fb7185',
  },
  thinking: {
    icon: Loader2,
    label: 'Processing',
    color: '#22d3ee',          // cyan-400
    glow: 'hsla(190,100%,55%,0.5)',
    border: 'hsla(190,100%,55%,0.35)',
    bg: 'hsla(200,80%,10%,0.65)',
    dotColor: '#67e8f9',
  },
  speaking: {
    icon: Volume2,
    label: 'Speaking',
    color: '#c084fc',          // purple-400 / amethyst
    glow: 'hsla(280,90%,65%,0.5)',
    border: 'hsla(280,90%,65%,0.35)',
    bg: 'hsla(270,60%,12%,0.65)',
    dotColor: '#e879f9',
  },
  idle: null,
};

// Animated bars for the "speaking" state
function SpeakingBars({ color }) {
  const heights = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.45];
  return (
    <div className="flex items-center gap-[2px]">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: color, height: 14 }}
          animate={{ scaleY: [h, 1, h * 0.6, 0.9, h] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Pinging dot for the "listening" state
function ListeningDot({ color }) {
  return (
    <span className="relative flex items-center justify-center w-4 h-4">
      <span
        className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-60"
        style={{ background: color }}
      />
      <span className="relative inline-flex rounded-full w-2.5 h-2.5" style={{ background: color }} />
    </span>
  );
}

// Spinning grid for the "thinking" state
function ThinkingGrid({ color }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      className="w-4 h-4 rounded-sm border-2"
      style={{ borderColor: `${color}80`, borderTopColor: color }}
    />
  );
}

export default function VoiceStateHUD({ listening, thinking, speaking, interim = '', size = 'md' }) {
  const stateKey = listening ? 'listening' : thinking ? 'thinking' : speaking ? 'speaking' : 'idle';
  const cfg = STATES[stateKey];

  const compact = size === 'sm';

  return (
    <AnimatePresence mode="wait">
      {cfg && (
        <motion.div
          key={stateKey}
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.94 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col items-center gap-2"
        >
          {/* Main pill */}
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              boxShadow: `0 0 18px -4px ${cfg.glow}, inset 0 1px 0 hsla(0,0%,100%,0.08)`,
            }}
          >
            {/* State-specific visual */}
            {stateKey === 'listening' && <ListeningDot color={cfg.dotColor} />}
            {stateKey === 'thinking' && <ThinkingGrid color={cfg.color} />}
            {stateKey === 'speaking' && <SpeakingBars color={cfg.color} />}

            {/* Label */}
            <span
              className="font-mono text-[11px] uppercase tracking-[0.3em] font-semibold"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>

          {/* Interim transcript — only when listening */}
          <AnimatePresence>
            {stateKey === 'listening' && interim && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-rose-200/70 text-[11px] italic max-w-[260px] text-center truncate px-2"
              >
                "{interim}"
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}