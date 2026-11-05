/**
 * FloatingCloverCompanion — persistent Clover on every page except Hub HeroOrb.
 * Can be minimized into a compact live pill while staying in an active hands-free
 * conversation, and interrupted at any time to steer the conversation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { on } from '@/lib/cloverWake';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Mic, Square } from 'lucide-react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import CloverVoicePanel from '@/components/hub/CloverVoicePanel.jsx';
import useCloverConversation from '@/components/hub/useCloverConversation.js';
import { triggerOrbHaptic } from '@/lib/orbAudio';

export default function FloatingCloverCompanion() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const isHub = location.pathname === '/';
  const isAdminOrDocs = ['/admin', '/docs', '/dev', '/signin', '/login', '/register', '/onboarding'].some((p) =>
    location.pathname.startsWith(p)
  );

  const clover = useCloverConversation();
  const [wakePulse, setWakePulse] = useState(false);
  const hiddenRef = useRef(false);
  hiddenRef.current = isHub || isAdminOrDocs;
  const startRef = useRef(clover.start);
  startRef.current = clover.start;
  const sendRef = useRef(clover.send);
  sendRef.current = clover.send;

  useEffect(() => on('wake', () => {
    if (hiddenRef.current) return;
    setWakePulse(true);
    setTimeout(() => setWakePulse(false), 900);
    triggerOrbHaptic('pulse');
    setExpanded(true);
    startRef.current("I'm here. What do you need?");
  }), []);

  useEffect(() => on('clover:ask', (question) => {
    if (hiddenRef.current || !question) return;
    setExpanded(true);
    startRef.current('Pulling it up.');
    setTimeout(() => sendRef.current?.(String(question)), 60);
  }), []);

  if (isHub || isAdminOrDocs) return null;

  const isTalkingOrActive = clover.phase !== 'idle';

  const handleOrbClick = () => {
    triggerOrbHaptic('tap');
    clover.unlock?.();

    if (clover.phase === 'idle' || clover.phase === 'resting') {
      setExpanded(true);
      const openers = [
        "Here, hound. What are we checking?",
        "Clover's up. Find or site?",
        "Talk. I'll pull the vault or open scan.",
      ];
      clover.start(openers[Math.floor(Math.random() * openers.length)]);
      return;
    }

    // If Clover is speaking or thinking, tapping the orb interrupts her immediately
    // so the user can change the flow of conversation.
    if (clover.phase === 'speaking' || clover.phase === 'thinking') {
      clover.nudge();
      return;
    }

    // While listening, tapping the orb toggles the panel between minimized and expanded
    setExpanded((prev) => !prev);
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end pointer-events-none select-none">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 14 }}
            className="pointer-events-auto mb-2.5"
          >
            <CloverVoicePanel
              compact
              phase={clover.phase}
              messages={clover.messages}
              interim={clover.interim}
              muted={clover.muted}
              onToggleMute={clover.toggleMute}
              getWaveBars={clover.getWaveBars}
              onMinimize={() => setExpanded(false)}
              onStop={() => {
                setExpanded(false);
                clover.end();
              }}
              onClose={() => {
                setExpanded(false);
                clover.end();
              }}
              voiceSupported={clover.voiceSupported}
              onSend={clover.send}
              onSpeak={clover.say}
              onListen={clover.nudge}
            />
          </motion.div>
        )}

        {!expanded && isTalkingOrActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="pointer-events-auto mb-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 border border-hud-cyan/35 bg-background/90 backdrop-blur-md shadow-lg"
          >
            <span className="h-2 w-2 rounded-full bg-hud-cyan animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-hud">
              {clover.phase === 'speaking'
                ? 'Speaking'
                : clover.phase === 'thinking'
                ? 'Thinking'
                : clover.phase === 'listening'
                ? 'Listening'
                : 'Paused'}
            </span>
            {(clover.phase === 'speaking' || clover.phase === 'thinking') && (
              <button
                type="button"
                onClick={() => clover.nudge()}
                aria-label="Interrupt Clover"
                className="px-1.5 py-0.5 rounded-full bg-hud-cyan/20 border border-hud-cyan/50 text-[9px] font-mono font-bold uppercase text-hud hover:bg-hud-cyan/30"
              >
                <Mic size={10} className="inline mr-0.5" />
                Interrupt
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Expand Clover chat box"
              className="p-1 rounded-full text-foreground/70 hover:text-foreground"
            >
              <Maximize2 size={11} />
            </button>
            <button
              type="button"
              onClick={() => clover.end()}
              aria-label="End Clover conversation"
              className="p-1 rounded-full text-destructive hover:opacity-80"
            >
              <Square size={10} fill="currentColor" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleOrbClick}
        aria-expanded={expanded}
        aria-controls="clover-voice-panel"
        aria-label={expanded ? 'Close Clover Voice' : 'Talk to Clover'}
        className="pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        style={{
          boxShadow: '0 0 24px hsla(270,90%,60%,0.45), 0 0 10px hsla(190,100%,50%,0.3)',
        }}
      >
        {wakePulse && (
          <span className="absolute inset-0 rounded-full pointer-events-none animate-ping"
            style={{ border: '2px solid #9FE8D0' }} />
        )}
        <div className="w-full h-full rounded-full overflow-hidden">
          <AmethystOrb
            size={56}
            orbState={clover.phase === 'resting' || clover.phase === 'idle' ? 'idle' : clover.phase}
            speaking={clover.phase === 'speaking'}
            listening={clover.phase === 'listening'}
            thinking={clover.phase === 'thinking'}
            getAmplitude={clover.getAmplitude}
            getSpectrum={clover.getSpectrum}
          />
        </div>
      </motion.button>
    </div>
  );
}