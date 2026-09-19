import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Gem } from 'lucide-react';

const MOBILE_MAX_WIDTH = 768; // px — anything wider is treated as desktop

// Public routes that must stay reachable on desktop for app-store review,
// SEO, and auditor access — these bypass the mobile-only gate.
const PUBLIC_ROUTES = [
  '/',
  '/explore',
  '/pricing',
  '/privacy-policy',
  '/terms',
  '/about',
  '/contact',
  '/demo',
  '/agate-guide',
  '/clubs',
  '/find-of-the-week',
  '/live',
  // Auth routes — must render on desktop so users can sign in/register
  '/login',
  '/register',
  '/auth',
  '/forgot-password',
  '/reset-password',
  // MCP OAuth consent — AI clients (Claude, ChatGPT) run on desktop
  '/oauth/consent',
];

function isPublicPath(pathname) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  // /live/:streamId is public
  if (pathname.startsWith('/live/')) return true;
  return false;
}

/**
 * MobileOnlyGate — RockHound-GO is a field companion built for phones.
 * On any viewport wider than a mobile breakpoint, the app is replaced with
 * a branded "mobile only" screen so desktop visitors get a clear message
 * instead of a stretched, broken layout.
 *
 * Public-facing routes (landing, legal, pricing, clubs, live) are exempt so
 * desktop reviewers, auditors, and search engines can reach them.
 */
export default function MobileOnlyGate({ children }) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth > MOBILE_MAX_WIDTH : false
  );
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > MOBILE_MAX_WIDTH);
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('resize', onResize);
    window.addEventListener('popstate', onPop);
    // Poll pathname — the gate sits outside BrowserRouter so it can't use useLocation.
    const interval = setInterval(() => setPathname(window.location.pathname), 300);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('popstate', onPop);
      clearInterval(interval);
    };
  }, []);

  if (!isDesktop || isPublicPath(pathname)) return children;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-8 text-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 30%, hsla(280,80%,28%,0.35) 0%, transparent 70%), ' +
          'linear-gradient(180deg, hsl(245 24% 9%) 0%, hsl(240 25% 5%) 100%)',
      }}
    >
      {/* Ambient orb glow */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{
          width: 320, height: 320, top: '50%', left: '50%',
          x: '-50%', y: '-50%',
          background: 'radial-gradient(circle, hsla(280,100%,60%,0.25) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-6 max-w-sm"
      >
        {/* Phone glyph with gem core */}
        <div className="relative">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, hsla(280,80%,45%,0.25) 0%, hsla(265,70%,30%,0.4) 100%)',
              border: '1px solid hsla(280,80%,65%,0.4)',
              boxShadow: '0 0 40px hsla(280,80%,50%,0.3), inset 0 1px 0 hsla(280,80%,90%,0.1)',
            }}
          >
            <Smartphone size={36} className="text-amethyst-glow" strokeWidth={1.5} />
          </motion.div>
          <motion.div
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, hsl(280 100% 85%) 0%, hsl(270 80% 55%) 70%)',
              boxShadow: '0 0 16px hsla(280,100%,70%,0.6)',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Gem size={14} className="text-white" strokeWidth={2} />
          </motion.div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-semibold mb-2">
            Rockhounding OS
          </div>
          <h1
            className="text-3xl font-black text-white"
            style={{ letterSpacing: '-0.02em', textShadow: '0 0 40px hsla(280,100%,75%,0.4)' }}
          >
            RockHound<span style={{ color: 'hsl(280,100%,88%)' }}> GO</span>
          </h1>
        </div>

        <p className="text-white/70 text-[15px] leading-relaxed font-light max-w-xs">
          This field companion is built for your phone — it goes where the rocks are.
        </p>

        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] text-amethyst-glow/90 font-medium"
          style={{
            background: 'hsla(280,80%,30%,0.15)',
            border: '1px solid hsla(280,80%,60%,0.3)',
          }}
        >
          <Smartphone size={14} />
          Please open this on a mobile device
        </div>

        <p className="text-white/30 text-[11px] leading-relaxed max-w-xs">
          Scan a specimen, navigate hotspots, and collect finds — all designed for the field, in your pocket.
        </p>
      </motion.div>
    </div>
  );
}