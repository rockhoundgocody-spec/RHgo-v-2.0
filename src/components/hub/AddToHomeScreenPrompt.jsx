/**
 * AddToHomeScreenPrompt — a warm, dismissible install banner for mobile users.
 *
 * On Android/Chrome it hooks the `beforeinstallprompt` event and offers a
 * native one-tap install. On iOS Safari (which has no install event) it
 * walks the user through Share → Add to Home Screen with inline glyphs.
 *
 * Stays out of the way: never shows if already installed (standalone mode)
 * or if the user dismissed it before. Sits above the bottom nav.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';

const DISMISS_KEY = 'rhgo_a2hs_dismissed';

export default function AddToHomeScreenPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState('android');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    // Already installed — standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isIOS) {
      setPlatform('ios');
      const t = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(t);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    } else {
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed left-1/2 bottom-24 z-[4000] -translate-x-1/2 w-[92%] max-w-sm px-2"
        >
          <div
            className="relative rounded-3xl p-5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsla(270,60%,25%,0.94) 0%, hsla(250,40%,12%,0.96) 100%)',
              border: '1px solid hsla(280,80%,65%,0.35)',
              boxShadow: '0 12px 40px hsla(265,60%,15%,0.5), inset 0 1px 0 hsla(270,80%,90%,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition"
              style={{ background: 'hsla(255,30%,12%,0.5)' }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'hsla(280,70%,40%,0.3)', border: '1px solid hsla(280,80%,60%,0.3)' }}
              >
                <Download size={22} className="text-amethyst-glow" style={{ filter: 'drop-shadow(0 0 6px hsla(280,100%,65%,0.5))' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-[15px] mb-1 leading-tight">
                  Add RockHound GO to your home screen
                </h3>
                <p className="text-white/55 text-[12px] leading-relaxed mb-3">
                  {platform === 'ios'
                    ? 'Install it for instant access, offline maps, and a native app feel.'
                    : 'Install it as an app for instant access, offline maps, and a native home-screen icon.'}
                </p>
                {platform === 'ios' ? (
                  <div className="flex items-center gap-2 text-white/75 text-[12px] font-medium">
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                      style={{ background: 'hsla(255,30%,12%,0.6)', border: '1px solid hsla(255,30%,30%,0.3)' }}>
                      <Share size={13} /> Share
                    </span>
                    <span className="text-white/30 text-[14px]">→</span>
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                      style={{ background: 'hsla(255,30%,12%,0.6)', border: '1px solid hsla(255,30%,30%,0.3)' }}>
                      <PlusSquare size={13} /> Add to Home Screen
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={install}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-[13px] active:scale-95 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, hsla(280,80%,50%,0.85), hsla(265,70%,40%,0.9))',
                      border: '1px solid hsla(280,80%,65%,0.4)',
                      boxShadow: '0 0 20px hsla(280,80%,50%,0.25)',
                    }}
                  >
                    Install app
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}