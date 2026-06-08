import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Context-aware tips per route
const ROUTE_TIPS = {
  '/':         ["Tap me to chat! 🍀", "How's your collection growing?", "Any new finds today?", "I sense crystals nearby…"],
  '/explore':  ["Hotspot ahead! Check the map 🗺️", "BLM land = free rockhounding!", "Look for dry creek beds!", "Ravens know where the gems are."],
  '/scan':     ["Point at the rock and hold still 📷", "Good lighting = better ID!", "Try multiple angles!", "I'll tell you what it is!"],
  '/collection': ["Your Geo-DEX is looking great! 💎", "Tap a specimen for full details.", "Rarest find first? Sort it!", "You're building a legend."],
  '/market':   ["Trade wisely, collect boldly! ⚡", "Check rarity before trading.", "Community finds the best stuff.", "Network = more rare finds!"],
  '/quests':   ["Complete quests for XP! ⚡", "Daily quests reset at midnight.", "Chain quests = bonus XP!", "You're close to leveling up!"],
};

const DEFAULT_TIPS = ["🍀 I'm Clover, tap to chat!", "Rockhounds unite!", "The earth wants to show you something."];

// Routes where the orb should hide (full-screen experiences)
const HIDDEN_ROUTES = ['/scan', '/onboarding', '/login', '/register', '/forgot-password', '/reset-password'];

export default function FloatingGrokOrb() {
  const location = useLocation();
  const [tip, setTip] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const tipTimer = useRef(null);
  const pulseTimer = useRef(null);

  const shouldHide = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r));

  // Rotate tips on route change or every 30s
  useEffect(() => {
    if (shouldHide) return;
    const tips = ROUTE_TIPS[location.pathname] || DEFAULT_TIPS;
    const pick = () => tips[Math.floor(Math.random() * tips.length)];

    // Show a tip 4s after arriving on a route
    const arrival = setTimeout(() => {
      setTip(pick());
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3500);
    }, 4000);

    // Periodic tips every 35s
    const periodic = setInterval(() => {
      setTip(pick());
      setShowTip(true);
      setTimeout(() => setShowTip(false), 3500);
    }, 35000);

    // Periodic excited pulse
    pulseTimer.current = setInterval(() => {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1200);
    }, 12000);

    return () => {
      clearTimeout(arrival);
      clearInterval(periodic);
      clearInterval(pulseTimer.current);
    };
  }, [location.pathname, shouldHide]);

  const handleTap = () => {
    const tips = ROUTE_TIPS[location.pathname] || DEFAULT_TIPS;
    setTip(tips[Math.floor(Math.random() * tips.length)]);
    setShowTip(true);
    setPulsing(true);
    clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setShowTip(false), 3000);
    setTimeout(() => setPulsing(false), 800);
  };

  if (shouldHide) return null;

  return (
    <div
      className="fixed z-40 select-none"
      style={{ bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))', right: 16 }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showTip && tip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.22 }}
            className="absolute right-0 bottom-[56px] w-48 px-3 py-2.5 rounded-2xl rounded-br-sm text-[12px] leading-snug font-medium text-white pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, hsla(270,50%,18%,0.95), hsla(240,40%,10%,0.98))',
              border: '1px solid hsla(280,80%,60%,0.35)',
              boxShadow: '0 4px 24px hsla(280,80%,40%,0.3), inset 0 1px 0 hsla(280,100%,80%,0.12)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {tip}
            {/* Tail */}
            <div className="absolute bottom-[-7px] right-4 w-3 h-3 rotate-45"
              style={{ background: 'hsla(255,40%,14%,0.97)', borderRight: '1px solid hsla(280,80%,60%,0.35)', borderBottom: '1px solid hsla(280,80%,60%,0.35)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb button */}
      <motion.button
        onClick={handleTap}
        animate={pulsing
          ? { scale: [1, 1.18, 0.95, 1.08, 1], filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1.1)', 'brightness(1.3)', 'brightness(1)'] }
          : { scale: [1, 1.03, 1] }
        }
        transition={pulsing
          ? { duration: 0.7, ease: 'easeInOut' }
          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
        whileTap={{ scale: 0.88 }}
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl cursor-pointer"
        style={{
          background: 'radial-gradient(circle at 35% 30%, hsla(280,90%,65%,0.9), hsla(265,80%,35%,0.95))',
          boxShadow: '0 0 20px hsla(280,100%,65%,0.55), 0 0 40px hsla(265,80%,45%,0.25), inset 0 1px 0 hsla(280,100%,85%,0.3)',
          border: '1.5px solid hsla(280,100%,75%,0.45)',
        }}
        aria-label="Chat with Clover"
      >
        🍀
      </motion.button>
    </div>
  );
}