/**
 * MariiChatWidget — floating AI assistant chat widget.
 * Shows a pulsing crystal button bottom-right; opens a slide-up (mobile) /
 * slide-in-from-right (desktop) panel embedding the Marii Superagent chat.
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const MARII_URL = 'https://app.base44.com/superagent/6a8eb90e3889960a8194fbe9';
const PULSE_SEEN_KEY = 'rhgo_marii_pulse_seen';

export default function MariiChatWidget() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [notifyDot, setNotifyDot] = useState(false);
  const panelRef = useRef(null);
  const isMobile = useIsMobile();

  // First-visit pulse — runs for ~6s then stops, remembered in localStorage.
  useEffect(() => {
    if (sessionStorage.getItem(PULSE_SEEN_KEY)) return;
    setShowPulse(true);
    const t = setTimeout(() => {
      setShowPulse(false);
      sessionStorage.setItem(PULSE_SEEN_KEY, '1');
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  // Notification dot: show once on mount, clears when the panel opens.
  useEffect(() => {
    if (sessionStorage.getItem('rhgo_marii_notified')) return;
    const t = setTimeout(() => setNotifyDot(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) {
      setNotifyDot(false);
      sessionStorage.setItem('rhgo_marii_notified', '1');
      setLoaded(false);
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Slide variants — bottom on mobile, right on desktop.
  const panelVariants = {
    hidden: { opacity: 0, y: '100%', x: 0 },
    visible: { opacity: 1, y: 0, x: 0 },
    exit: { opacity: 0, y: '100%' },
  };
  const desktopVariants = {
    hidden: { opacity: 0, x: '100%', y: 0 },
    visible: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: '100%' },
  };

  return (
    <>
      {/* Floating button — always bottom-right, above the nav. */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Marii chat' : 'Open Marii chat'}
        aria-expanded={open}
        className="fixed z-[5000] flex items-center justify-center rounded-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60"
        style={{
          bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          right: '76px',
          width: 52,
          height: 52,
          background: '#0a0a14',
          border: '1px solid hsla(280, 80%, 65%, 0.45)',
          boxShadow: '0 0 22px hsla(280, 90%, 60%, 0.45), 0 4px 18px hsla(250, 60%, 4%, 0.5), inset 0 1px 0 hsla(280, 100%, 85%, 0.18)',
        }}
        animate={showPulse ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={showPulse ? { duration: 1.4, repeat: 4, ease: 'easeInOut' } : { duration: 0.2 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Glow ring behind button */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: showPulse ? '0 0 0 0 hsla(280, 90%, 65%, 0.5)' : 'none', animation: showPulse ? 'marii-ping 1.4s ease-out 4' : 'none' }}
        />
        <Sparkles size={22} className="text-amethyst-glow" style={{ filter: 'drop-shadow(0 0 6px hsla(280, 100%, 80%, 0.7))' }} />

        {/* Notification dot */}
        <AnimatePresence>
          {notifyDot && !open && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
              style={{ background: 'hsl(310, 100%, 68%)', border: '2px solid #0a0a14', boxShadow: '0 0 8px hsla(310, 100%, 65%, 0.8)' }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop — mobile only, tap to close */}
              <motion.div
                className="fixed inset-0 z-[5990] bg-black/50 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />

              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="marii-panel-title"
                data-marii-panel
                className="fixed z-[6000] flex flex-col overflow-hidden"
                style={{
                  bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
                  left: '8px',
                  right: '8px',
                  height: '70vh',
                }}
                variants={isMobile ? panelVariants : desktopVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              >
                {/* Desktop sizing — slide in from the right, 400px wide */}
                <style>{`
                  @media (min-width: 768px) {
                    [data-marii-panel] {
                      left: auto !important;
                      right: 16px !important;
                      bottom: 16px !important;
                      top: 80px !important;
                      width: 400px !important;
                      height: auto !important;
                      max-height: 75vh !important;
                    }
                  }
                `}</style>
                <div className="flex flex-col w-full h-full" style={{
                  background: 'linear-gradient(160deg, hsla(255, 30%, 12%, 0.98), hsla(248, 40%, 6%, 0.99))',
                  border: '1px solid hsla(280, 70%, 60%, 0.35)',
                  borderRadius: 20,
                  boxShadow: '0 12px 48px hsla(250, 60%, 4%, 0.6), 0 0 32px hsla(280, 80%, 50%, 0.25), inset 0 1px 0 hsla(280, 100%, 85%, 0.12)',
                  backdropFilter: 'blur(24px)',
                }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'hsla(280, 60%, 60%, 0.2)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(280, 80%, 70%), hsl(260, 70%, 55%))', boxShadow: '0 0 12px hsla(280, 90%, 65%, 0.6)' }}>
                        <Sparkles size={16} className="text-white" />
                      </div>
                      <div>
                        <div id="marii-panel-title" className="text-sm font-bold text-white leading-tight">Marii</div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-amethyst-glow/70 leading-tight">AI Assistant</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close Marii chat"
                      className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Iframe + loading shimmer */}
                  <div className="relative flex-1 min-h-0">
                    {!loaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-transparent">
                        <div className="w-9 h-9 rounded-full border-2 border-amethyst-glow/20 border-t-amethyst-glow animate-spin" />
                        <div className="text-[11px] text-amethyst-glow/60 tracking-wider">Connecting to Marii…</div>
                        {/* Shimmer bars */}
                        <div className="w-3/4 mt-2 space-y-2">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="h-2.5 rounded-full overflow-hidden" style={{ background: 'hsla(280, 40%, 30%, 0.25)' }}>
                              <motion.div
                                className="h-full"
                                style={{ background: 'linear-gradient(90deg, transparent, hsla(280, 100%, 80%, 0.4), transparent)' }}
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <iframe
                      src={MARII_URL}
                      title="Marii AI Assistant"
                      onLoad={() => setLoaded(true)}
                      className="w-full h-full border-0 rounded-b-[20px]"
                      style={{ background: 'transparent', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                      allow="clipboard-write; microphone; camera"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}