/**
 * VoiceStateHUD — voice conversation status indicator for the Clover orb.
 * Shows: Listening (with interim transcript), Thinking (spinner), Speaking (with reply text).
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATES = {
  listening: {
    label:     'Listening',
    color:     '#f43f5e',
    glow:      'hsla(345,90%,58%,0.5)',
    border:    'hsla(345,90%,58%,0.35)',
    bg:        'hsla(345,80%,14%,0.65)',
    dotColor:  '#fb7185',
  },
  thinking: {
    label:     'Thinking…',
    color:     '#22d3ee',
    glow:      'hsla(190,100%,55%,0.45)',
    border:    'hsla(190,100%,55%,0.3)',
    bg:        'hsla(200,80%,10%,0.65)',
    dotColor:  '#67e8f9',
  },
  speaking: {
    label:     'Speaking',
    color:     '#c084fc',
    glow:      'hsla(280,90%,65%,0.45)',
    border:    'hsla(280,90%,65%,0.3)',
    bg:        'hsla(270,60%,12%,0.65)',
    dotColor:  '#e879f9',
  },
};

function ListeningDot({ color }) {
  return (
    <span className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
      <span className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-55"
        style={{ background: color }} />
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: color }} />
    </span>
  );
}

function ThinkingDots({ color }) {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[5px] h-[5px] rounded-full"
          style={{ background: color }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

function SpeakingBars({ color }) {
  const heights = [0.45, 0.75, 1, 0.6, 0.85, 0.5, 0.9, 0.5];
  return (
    <div className="flex items-center gap-[2px]">
      {heights.map((h, i) => (
        <motion.div key={i} className="w-[3px] rounded-full"
          style={{ background: color, height: 13 }}
          animate={{ scaleY: [h, 1, h * 0.55, 0.85, h] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.065, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function VoiceStateHUD({ listening, thinking, speaking, interim = '', lastReply = '' }) {
  const stateKey = listening ? 'listening' : thinking ? 'thinking' : speaking ? 'speaking' : null;
  const cfg = stateKey ? STATES[stateKey] : null;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <AnimatePresence mode="wait">
        {cfg && (
          <motion.div
            key={stateKey}
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.16 }}
          >
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md"
              style={{
                background:  cfg.bg,
                border:      `1px solid ${cfg.border}`,
                boxShadow:   `0 0 16px -4px ${cfg.glow}, inset 0 1px 0 hsla(0,0%,100%,0.07)`,
              }}
            >
              {stateKey === 'listening' && <ListeningDot   color={cfg.dotColor} />}
              {stateKey === 'thinking'  && <ThinkingDots   color={cfg.color}    />}
              {stateKey === 'speaking'  && <SpeakingBars   color={cfg.color}    />}

              <span
                className="font-mono text-[11px] uppercase tracking-[0.28em] font-semibold"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim transcript while listening */}
      <AnimatePresence>
        {listening && interim && (
          <motion.div
            key="interim"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-rose-200/65 text-[11px] italic text-center max-w-[260px] px-2 leading-snug"
          >
            "{interim}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clover's last reply — shown while speaking so user can read along */}
      <AnimatePresence>
        {speaking && lastReply && (
          <motion.div
            key="reply"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-center px-4 max-w-[280px]"
          >
            <p className="text-amethyst-glow/80 text-[12px] leading-relaxed font-light">
              {lastReply}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}