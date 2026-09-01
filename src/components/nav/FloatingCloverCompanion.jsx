/**
 * FloatingCloverCompanion.jsx — Persistent floating Clover orb throughout the entire app.
 *
 * Provides users with Clover companionship everywhere (Explore map, Scanner, GeoDex, Quests, Market):
 * - Hides automatically on the Hub where the full HeroOrb is displayed
 * - Shows an interactive glowing mini-orb on all other pages
 * - 1-tap expansion into hands-free voice dialogue with Irish-American female persona
 * - Shows proactive field alerts and mineral tips right where the explorer is
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import CloverVoicePanel from '@/components/hub/CloverVoicePanel.jsx';
import useCloverConversation from '@/components/hub/useCloverConversation.js';
import { playOrbChime, triggerOrbHaptic } from '@/lib/orbAudio';
import { evaluateProactiveFieldSituation } from '@/lib/proactiveFieldCopilot';

export default function FloatingCloverCompanion() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [fieldAlert, setFieldAlert] = useState(null);
  const alertDismissedRef = useRef(false);

  // Hide on Hub ('/') where HeroOrb is already the centerpiece, and admin/docs
  const isHub = location.pathname === '/';
  const isAdminOrDocs = ['/admin', '/docs', '/dev', '/login', '/register', '/onboarding'].some((p) =>
    location.pathname.startsWith(p)
  );

  const clover = useCloverConversation({
    onFindLogged: (name) => {
      // Find logged notification
    },
  });

  // Evaluate proactive field alerts once GPS is available
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation || isHub) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const alerts = await evaluateProactiveFieldSituation(pos.coords.latitude, pos.coords.longitude);
        if (alerts && alerts.length > 0 && !alertDismissedRef.current) {
          setFieldAlert(alerts[0]);
        }
      },
      () => {},
      { timeout: 8000 }
    );
  }, [location.pathname, isHub]);

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
      {/* Proactive Field Alert Banner */}
      <AnimatePresence>
        {fieldAlert && !expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="pointer-events-auto mb-2 mr-1 p-2.5 max-w-[220px] rounded-xl text-xs backdrop-blur-md shadow-lg border border-amber-400/40"
            style={{ background: 'hsla(260,30%,12%,0.92)' }}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 mb-1">
              <span className="flex items-center gap-1">
                <Sparkles size={11} /> {fieldAlert.badge}
              </span>
              <button
                onClick={() => {
                  setFieldAlert(null);
                  alertDismissedRef.current = true;
                }}
                className="text-white/40 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-[11px] text-white/90 line-clamp-2 leading-tight">
              {fieldAlert.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Voice Conversation Drawer */}
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

        {/* Proactive alert ping dot */}
        {fieldAlert && !expanded && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
