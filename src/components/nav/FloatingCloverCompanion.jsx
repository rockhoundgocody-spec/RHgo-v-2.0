/**
 * FloatingCloverCompanion.jsx — Persistent floating Clover orb throughout the entire app.
 *
 * Provides users with Clover companionship everywhere (Explore map, Scanner, GeoDex, Quests, Market):
 * - Hides automatically on the Hub where the full HeroOrb is displayed
 * - Shows an interactive glowing mini-orb on all other pages
 * - 1-tap expansion into hands-free voice dialogue with Irish-American female persona
 * - Shows proactive field alerts and mineral tips right where the explorer is
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import CloverVoicePanel from '@/components/hub/CloverVoicePanel.jsx';
import useCloverConversation from '@/components/hub/useCloverConversation.js';
import { playOrbChime, triggerOrbHaptic } from '@/lib/orbAudio';

export default function FloatingCloverCompanion() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Hide on Hub ('/') where HeroOrb is already the centerpiece, and admin/docs
  const isHub = location.pathname === '/';
  const isAdminOrDocs = ['/admin', '/docs', '/dev', '/login', '/register', '/onboarding'].some((p) =>
    location.pathname.startsWith(p)
  );

  const clover = useCloverConversation({
    onFindLogged: (_name) => {
      // Find logged notification
    },
  });

  if (isHub || isAdminOrDocs) return null;

  const handleOrbClick = () => {
    playOrbChime(528, 1.2);
    triggerOrbHaptic('tap');
    if (!expanded) {
      setExpanded(true);
      if (clover.phase === 'idle') {
        const openers = [
          "Hey there! What are we checking out?",
          "I'm right here with you — find anything good?",
          "Need a quick mineral check or field tip?",
        ];
        clover.start(openers[Math.floor(Math.random() * openers.length)]);
      }
    } else {
      setExpanded(false);
      clover.stop();
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end pointer-events-none select-none">
      {/* Expanded Voice Conversation Drawer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id="clover-voice-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto mb-3"
          >
            <CloverVoicePanel
              phase={clover.phase}
              messages={clover.messages}
              interim={clover.interim}
              onClose={() => {
                setExpanded(false);
                clover.stop();
              }}
              onHunt={() => {}}
              huntLoading={false}
              voiceSupported={true}
              onSend={clover.send}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Mini Orb Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleOrbClick}
        aria-expanded={expanded}
        aria-controls="clover-voice-panel"
        aria-label={expanded ? 'Close Clover voice panel' : 'Talk to Clover'}
        className="pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        style={{
          boxShadow: '0 0 24px hsla(270,90%,60%,0.45), 0 0 10px hsla(190,100%,50%,0.3)',
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden">
          <AmethystOrb
            size={56}
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