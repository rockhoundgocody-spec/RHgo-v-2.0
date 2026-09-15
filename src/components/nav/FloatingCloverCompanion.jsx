/**
 * FloatingCloverCompanion — persistent Clover on every page except Hub HeroOrb.
 * Visual of HeroOrb / AmethystOrb is unchanged.
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

  const isHub = location.pathname === '/';
  const isAdminOrDocs = ['/admin', '/docs', '/dev', '/login', '/register', '/onboarding'].some((p) =>
    location.pathname.startsWith(p)
  );

  const clover = useCloverConversation();

  if (isHub || isAdminOrDocs) return null;

  const handleOrbClick = () => {
    playOrbChime(528, 1.2);
    triggerOrbHaptic('tap');
    if (!expanded) {
      setExpanded(true);
      if (clover.phase === 'idle') {
        const openers = [
          "Here, hound. What are we checking?",
          "Clover's up. Find or site?",
          "Talk. I'll pull the vault or open scan.",
        ];
        clover.start(openers[Math.floor(Math.random() * openers.length)]);
      }
    } else {
      setExpanded(false);
      clover.end();
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end pointer-events-none select-none">
      <AnimatePresence>
        {expanded && (
          <motion.div
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
                clover.end();
              }}
              onHunt={() => {}}
              huntLoading={false}
              voiceSupported={clover.voiceSupported}
              onSend={clover.send}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleOrbClick}
        className="pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl focus:outline-none"
        style={{
          boxShadow: '0 0 24px hsla(270,90%,60%,0.45), 0 0 10px hsla(190,100%,50%,0.3)',
        }}
        aria-label="Talk to Clover"
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
