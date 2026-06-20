/**
 * StreakReminderBanner — daily reminder to check in and keep the discovery streak alive.
 * Shows once per day, after a short delay, dismissible per session.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useBannerSlot } from '@/lib/bannerMutex';

const SESSION_KEY = 'rhgo_streak_reminder_dismissed';
const STORAGE_KEY = 'rhgo_streak_reminder_last_shown';

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

const MESSAGES = [
  { text: "Your streak is waiting — tap Clover for today's check-in!", cta: 'Check In', to: '/companion' },
  { text: 'Found anything cool today? Log it to keep your streak alive.', cta: 'Log a Find', to: '/scan' },
  { text: "Don't let your streak cool off — explore a hotspot nearby!", cta: 'Explore', to: '/explore' },
  { text: 'A quick check-in keeps Clover happy and your streak burning 🔥', cta: 'Check In', to: '/companion' },
];

export default function StreakReminderBanner() {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState(null);
  const { tryAcquire, release } = useBannerSlot('streak');

  useEffect(() => {
    // Only show once per day, and not if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === getTodayStr()) return;

    const dayIndex = new Date().getDay() % MESSAGES.length;
    setMsg(MESSAGES[dayIndex]);

    // Delay appearance; also wait for slot to be free
    const t = setTimeout(() => {
      if (tryAcquire()) setVisible(true);
    }, 3500);
    return () => clearTimeout(t);
  }, [tryAcquire]);

  const dismiss = () => {
    setVisible(false);
    release();
    sessionStorage.setItem(SESSION_KEY, '1');
    localStorage.setItem(STORAGE_KEY, getTodayStr());
    base44.analytics.track({ eventName: 'streak_reminder_dismissed' });
  };

  const handleCta = () => {
    dismiss();
    base44.analytics.track({ eventName: 'streak_reminder_cta_tapped', properties: { cta: msg?.cta } });
  };

  if (!msg) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed top-3 inset-x-3 z-[9000] rounded-2xl flex items-center gap-3 px-4 py-3 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, hsla(25,100%,28%,0.97) 0%, hsla(15,90%,22%,0.99) 100%)',
            border: '1px solid hsla(30,100%,55%,0.45)',
            boxShadow: '0 0 32px hsla(25,100%,50%,0.25)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsla(30,100%,50%,0.2)', border: '1px solid hsla(30,100%,60%,0.35)' }}>
            <Flame size={18} style={{ color: 'hsl(30,100%,65%)' }} />
          </div>

          <p className="flex-1 text-white/85 text-[12px] leading-snug">{msg.text}</p>

          <Link
            to={msg.to}
            onClick={handleCta}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all active:scale-95"
            style={{
              background: 'hsla(30,100%,55%,0.25)',
              border: '1px solid hsla(30,100%,60%,0.5)',
              color: 'hsl(30,100%,72%)',
            }}
          >
            <Zap size={11} />
            {msg.cta}
          </Link>

          <button onClick={dismiss} className="shrink-0 text-white/30 hover:text-white/60 transition ml-1">
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}