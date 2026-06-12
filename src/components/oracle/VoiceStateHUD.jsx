/**
 * VoiceStateHUD — voice conversation status + typewriter reply display.
 * - Listening: pulsing dot + live interim transcript
 * - Thinking: bouncing dots
 * - Speaking: waveform bars + words appear one-by-one as Clover speaks
 * - After speaking: reply lingers for 3s so user can read it
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THINKING_PHRASES = [
  'On it…',
  'Hmm…',
  'Let me think…',
  'Good question…',
  'Just a sec…',
  'Processing…',
];

const STATES = {
  listening: {
    label:    'Listening…',
    color:    '#f43f5e',
    glow:     'hsla(345,90%,58%,0.5)',
    border:   'hsla(345,90%,58%,0.35)',
    bg:       'hsla(345,80%,14%,0.65)',
    dotColor: '#fb7185',
  },
  thinking: {
    label:    'Thinking…',
    color:    '#22d3ee',
    glow:     'hsla(190,100%,55%,0.45)',
    border:   'hsla(190,100%,55%,0.3)',
    bg:       'hsla(200,80%,10%,0.65)',
    dotColor: '#67e8f9',
  },
  speaking: {
    label:    'Speaking',
    color:    '#c084fc',
    glow:     'hsla(280,90%,65%,0.45)',
    border:   'hsla(280,90%,65%,0.3)',
    bg:       'hsla(270,60%,12%,0.65)',
    dotColor: '#e879f9',
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

/** Typewriter: reveals words one at a time as Clover speaks */
function TypewriterText({ text, active }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const words = text ? text.split(' ') : [];
  const timerRef = useRef(null);

  useEffect(() => {
    setVisibleCount(0);
    if (!text || !active) return;
    // spread word reveals over ~80% of average speaking time
    // ~130 wpm average TTS → ~1 word per 460ms, but we go slightly faster for feel
    const msPerWord = Math.max(180, Math.min(340, (text.length * 55) / words.length));
    let count = 0;
    const tick = () => {
      count++;
      setVisibleCount(count);
      if (count < words.length) {
        timerRef.current = setTimeout(tick, msPerWord);
      }
    };
    timerRef.current = setTimeout(tick, 120); // small initial delay
    return () => clearTimeout(timerRef.current);
  }, [text, active]);

  // When no longer active (speech ended), show all words
  useEffect(() => {
    if (!active && text) setVisibleCount(words.length);
  }, [active, text]);

  if (!words.length) return null;

  return (
    <span>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: i < visibleCount ? 1 : 0, y: i < visibleCount ? 0 : 3 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export default function VoiceStateHUD({ listening, thinking, speaking, interim = '', lastReply = '' }) {
  const stateKey = listening ? 'listening' : thinking ? 'thinking' : speaking ? 'speaking' : null;
  const cfg = stateKey ? STATES[stateKey] : null;

  // Vary thinking phrase each time thinking starts
  const [thinkingPhrase, setThinkingPhrase] = useState(THINKING_PHRASES[0]);
  const prevThinking = useRef(false);
  useEffect(() => {
    if (thinking && !prevThinking.current) {
      setThinkingPhrase(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
    }
    prevThinking.current = thinking;
  }, [thinking]);

  // Linger: keep reply visible for a beat after speaking ends
  const [lingerReply, setLingerReply] = useState('');
  const lingerTimer = useRef(null);

  useEffect(() => {
    if (speaking && lastReply) {
      clearTimeout(lingerTimer.current);
      setLingerReply(lastReply);
    } else if (!speaking && lingerReply) {
      clearTimeout(lingerTimer.current);
      lingerTimer.current = setTimeout(() => setLingerReply(''), 3200);
    }
    return () => clearTimeout(lingerTimer.current);
  }, [speaking, lastReply]);

  const showReply = (speaking || !!lingerReply) && (lastReply || lingerReply);
  const replyText = lastReply || lingerReply;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Status pill */}
      <AnimatePresence mode="wait">
        {cfg && (
          <motion.div
            key={stateKey}
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.16 }}
          >
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                boxShadow: `0 0 16px -4px ${cfg.glow}, inset 0 1px 0 hsla(0,0%,100%,0.07)`,
              }}
            >
              {stateKey === 'listening' && <ListeningDot color={cfg.dotColor} />}
              {stateKey === 'thinking'  && <ThinkingDots color={cfg.color} />}
              {stateKey === 'speaking'  && <SpeakingBars color={cfg.color} />}
              <span
                className="font-mono text-[11px] uppercase tracking-[0.28em] font-semibold"
                style={{ color: cfg.color }}
              >
                {stateKey === 'thinking' ? thinkingPhrase : cfg.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live interim transcript */}
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

      {/* Clover's reply — typewriter while speaking, full text lingers after */}
      <AnimatePresence>
        {showReply && (
          <motion.div
            key="reply"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="text-center px-4 max-w-[300px]"
          >
            <p className="text-amethyst-glow/85 text-[13px] leading-relaxed font-light">
              <TypewriterText text={replyText} active={speaking} />
            </p>
            {/* Subtle "tap to respond" nudge after Clover finishes */}
            <AnimatePresence>
              {!speaking && lingerReply && !listening && !thinking && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mt-1.5 text-white/25 text-[10px] tracking-widest uppercase"
                >
                  tap to respond
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}