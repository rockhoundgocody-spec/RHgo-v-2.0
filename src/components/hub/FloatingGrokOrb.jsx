/**
 * FloatingGrokOrb V2.5 — emotionally expressive crystal companion & voice assistant
 * Shows context-aware tips with geologist voice, liquid-glass bubble,
 * and expands into full hands-free voice conversation on tap from any page.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sparkles, Zap, Compass, Moon } from 'lucide-react';
import useCloverConversation from './useCloverConversation';
import CloverVoicePanel from './CloverVoicePanel.jsx';
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));
import useLiquidInteraction from '@/lib/useLiquidInteraction';
import { base44 } from '@/api/base44Client';

const ROUTE_TIPS = {
  '/':         ["Tap me to chat! 🍀", "How's your collection growing?", "Any new finds today?", "I sense crystals nearby…", "Every rock has a story waiting."],
  '/explore':  ["🗺️ Hotspot ahead — check the map!", "BLM land = free rockhounding!", "Look for dry creek beds 🪨", "Ravens always know where the gems hide.", "Granite outcrops = quartz veins nearby!"],
  '/scan':     ["📷 Hold still for best ID accuracy", "Good lighting = sharper crystal match!", "Try rotating for multiple facet angles.", "I'll identify it in seconds!", "Fresh break = best color read."],
  '/collection': ["💎 Your Geo-DEX is legendary!", "Tap any specimen for full passport.", "Sort by rarity to find your crown jewel.", "You're building a geological legacy.", "Compare crystal systems — science is art!"],
  '/market':   ["⚡ Trade wisely, collect boldly!", "Check rarity before swapping.", "Community finds the rarest specimens.", "Network = more legendary finds!", "Provenance adds real value."],
  '/quests':   ["Complete quests for XP! ⚡", "Daily quests reset at midnight.", "Chain quests = bonus XP multiplier!", "You're close to leveling up!", "Streak bonuses are huge — stay consistent!"],
};

const DEFAULT_TIPS = ["🍀 Tap me — I'm Clover, your geo guide!", "The earth is hiding something beautiful nearby.", "Rockhounds unite! Let's find something epic."];

const GREETINGS = [
  "Hey there! What are you finding out in the field today?",
  "Oh hey! Need an expert read on a rock, or just checking in?",
  "Good to hear from you! What's on your mind?",
  "Hey! I'm right here — tell me about your latest discovery.",
];

// Emotions: idle, excited, wise, sleepy — obsidian disc, accent-tinted icon
const MOOD_STYLES = {
  idle:    { bg: 'linear-gradient(160deg, hsl(250 18% 14%) 0%, hsl(248 22% 7%) 100%)', glow: 'hsla(280,80%,55%,0.3)', border: 'hsla(280,70%,65%,0.4)', Icon: Sparkles, iconColor: 'hsl(280,80%,82%)' },
  excited: { bg: 'linear-gradient(160deg, hsl(250 18% 14%) 0%, hsl(248 22% 7%) 100%)', glow: 'hsla(310,90%,60%,0.45)', border: 'hsla(310,80%,70%,0.55)', Icon: Zap, iconColor: 'hsl(310,90%,80%)' },
  wise:    { bg: 'linear-gradient(160deg, hsl(250 18% 14%) 0%, hsl(248 22% 7%) 100%)', glow: 'hsla(195,90%,55%,0.4)', border: 'hsla(195,80%,65%,0.5)', Icon: Compass, iconColor: 'hsl(195,90%,78%)' },
  sleepy:  { bg: 'linear-gradient(160deg, hsl(250 18% 14%) 0%, hsl(248 22% 7%) 100%)', glow: 'hsla(240,50%,50%,0.25)', border: 'hsla(240,40%,60%,0.3)', Icon: Moon, iconColor: 'hsla(240,50%,80%,0.8)' },
};

const HIDDEN_ROUTES = ['/', '/scan', '/onboarding', '/login', '/register', '/forgot-password', '/reset-password'];

export default function FloatingGrokOrb() {
  const location = useLocation();
  const [tip, setTip] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [mood, setMood] = useState('idle');
  const [loggedFind, setLoggedFind] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [companion, setCompanion] = useState(null);

  const tipTimer = useRef(null);
  const pulseTimer = useRef(null);
  const { getInteraction, injectTap } = useLiquidInteraction();

  const clover = useCloverConversation({
    companion,
    todaysSpecimens: 0,
    onFindLogged: (name) => {
      setLoggedFind(name);
      setTimeout(() => setLoggedFind(null), 4000);
    },
  });

  const open = clover.phase !== 'idle';
  const shouldHide = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r));

  // Fetch companion state once for conversation context
  useEffect(() => {
    base44.functions.invoke('getCompanionState', {})
      .then((res) => setCompanion(res?.data?.companion || null))
      .catch(() => {});
  }, []);

  const pickTip = (pathname) => {
    const tips = ROUTE_TIPS[pathname] || DEFAULT_TIPS;
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const flashTip = (text, moodType = 'idle') => {
    if (open) return; // Don't interrupt active conversation panel
    setTip(text);
    setMood(moodType);
    setShowTip(true);
    clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => {
      setShowTip(false);
      setTimeout(() => setMood('idle'), 600);
    }, 3800);
  };

  // Route change: show tip after arrival
  useEffect(() => {
    if (shouldHide) return;
    const arrival = setTimeout(() => {
      const t = pickTip(location.pathname);
      const isGeoTip = location.pathname === '/explore' || location.pathname === '/scan';
      flashTip(t, isGeoTip ? 'wise' : 'idle');
    }, 4000);

    // Periodic tips
    const periodic = setInterval(() => {
      flashTip(pickTip(location.pathname), 'idle');
    }, 38000);

    // Excited pulses
    pulseTimer.current = setInterval(() => {
      setMood('excited');
      setTimeout(() => setMood('idle'), 1400);
    }, 14000);

    return () => {
      clearTimeout(arrival);
      clearInterval(periodic);
      clearInterval(pulseTimer.current);
    };
  }, [location.pathname, shouldHide, open]);

  const handleTap = (e) => {
    if (e?.clientX != null) injectTap(e.clientX, e.clientY);
    setShowTip(false);

    if (!open) {
      const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      clover.start(greeting);
    } else {
      clover.nudge();
    }
  };

  const handleHunt = async () => {
    if (suggestLoading) return;
    setSuggestLoading(true);
    try {
      const cached = sessionStorage.getItem('rhgo_last_gps');
      const gps = cached ? JSON.parse(cached) : {};
      const res = await base44.functions.invoke('suggestNextFinds', {
        lat: gps.lat ?? null, lng: gps.lng ?? null,
      });
      if (res?.data?.suggestions?.length) setSuggestions(res.data);
    } catch (err) {
      console.error('suggestNextFinds failed:', err);
    } finally {
      setSuggestLoading(false);
    }
  };

  if (shouldHide) return null;

  const orbState = clover.phase === 'thinking' ? 'thinking'
    : clover.phase === 'speaking' ? 'speaking'
    : clover.phase === 'listening' ? 'listening'
    : 'idle';

  return (
    <div
      className="fixed z-40 select-none flex flex-col items-end"
      style={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', right: 14 }}
    >
      {/* Active Conversation Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-3"
          >
            <CloverVoicePanel
              phase={clover.phase}
              messages={clover.messages}
              interim={clover.interim}
              onClose={clover.end}
              onHunt={handleHunt}
              huntLoading={suggestLoading}
              suggestions={suggestions}
              onDismissSuggestions={() => setSuggestions(null)}
              voiceSupported={clover.voiceSupported}
              onSend={clover.send}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble when not open */}
      <AnimatePresence>
        {!open && showTip && tip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 bottom-[58px] w-52 px-3.5 py-3 rounded-2xl rounded-br-sm text-[12px] leading-snug font-medium text-white pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, hsla(265,45%,16%,0.97), hsla(240,40%,8%,0.99))',
              border: `1px solid hsla(280,80%,60%,0.32)`,
              boxShadow: '0 4px 28px hsla(280,80%,40%,0.35), inset 0 1px 0 hsla(280,100%,80%,0.14)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Mood indicator dot */}
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 align-middle"
              style={{ background: mood === 'wise' ? 'hsl(195,100%,65%)' : mood === 'excited' ? 'hsl(310,100%,70%)' : 'hsl(280,90%,72%)' }}
            />
            {tip}
            {/* Tail */}
            <div
              className="absolute bottom-[-7px] right-4 w-3.5 h-3.5 rotate-45"
              style={{
                background: 'hsla(250,40%,11%,0.99)',
                borderRight: '1px solid hsla(280,80%,60%,0.3)',
                borderBottom: '1px solid hsla(280,80%,60%,0.3)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Orb Button */}
      {open ? (
        <div
          onClick={handleTap}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTap(e)}
          className="relative cursor-pointer select-none active:scale-95 transition-transform"
          style={{ width: 56, height: 56 }}
          aria-label="Clover active conversation"
        >
          <React.Suspense fallback={<div style={{ width: 56, height: 56 }} />}>
            <AmethystOrb
              size={56}
              orbState={orbState}
              level={companion?.level || 1}
              getInteraction={getInteraction}
              getAmplitude={clover.getAmplitude}
              getSpectrum={clover.getSpectrum}
            />
          </React.Suspense>
        </div>
      ) : (
        <motion.div
          onClick={handleTap}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTap(e)}
          animate={mood === 'excited'
            ? { scale: [1, 1.22, 0.93, 1.12, 1], rotate: [0, -6, 4, -2, 0] }
            : mood === 'wise'
            ? { scale: [1, 1.06, 1] }
            : { scale: [1, 1.035, 1] }
          }
          transition={mood !== 'idle'
            ? { duration: 0.75, ease: 'easeInOut' }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
          }
          whileTap={{ scale: 0.85 }}
          className="relative cursor-pointer select-none"
          style={{ width: 48, height: 48 }}
          aria-label="Chat with Clover"
        >
          <React.Suspense fallback={<div style={{ width: 48, height: 48 }} />}>
            <AmethystOrb
              size={48}
              orbState="idle"
              level={companion?.level || 1}
              getInteraction={getInteraction}
            />
          </React.Suspense>
        </motion.div>
      )}
    </div>
  );
}