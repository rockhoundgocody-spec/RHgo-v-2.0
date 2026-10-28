import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import GoogleIcon from '@/components/GoogleIcon';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';
import SeoJsonLd from '@/components/SeoJsonLd.jsx';
import GeodesicOrbBackground from '@/components/visuals/GeodesicOrbBackground';
import GrokBotBadge from '@/components/GrokBotBadge.jsx';
import HudGridBackdrop from '@/components/landing/HudGridBackdrop.jsx';
import HeroPhoto from '@/components/landing/HeroPhoto.jsx';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];
const rise = (delay) => ({
  initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.9, delay, ease: EASE },
});

const HERO_IMG = 'https://media.base44.com/images/public/69f35dd14650b54681c835ec/e29b0b8c6_generated_image.png';

/**
 * Landing — the public gate.
 * One photo. One line. Two buttons. No paywall.
 * Dark #0a0a14, mint #9FE8D0 for action only.
 */
export default function Landing() {
  useSeoRobots(true);
  useSeoMeta(
    'RockHound-GO — AI Rock & Mineral ID for Rockhounds',
    'Identify rocks and minerals from a photo, check land status before you collect, and log every find in your Geo-DEX. The AI field kit for rockhounds.'
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden"
      style={{ background: '#0a0a14' }}>
      <SeoJsonLd />

      {/* Geodesic orb background — drifting glowing spheres */}
      <GeodesicOrbBackground />
      <HudGridBackdrop />

      <div className="flex-1 w-full flex items-center justify-center gap-10 xl:gap-16 lg:px-10">

      {/* ── HERO ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-md lg:max-w-xl relative z-10">

        <HeroPhoto src={HERO_IMG} />

        {/* One line */}
        <h1 className="text-white font-black text-[28px] lg:text-5xl leading-[1.1] text-center mb-2"
          style={{ letterSpacing: '-0.02em' }}>
          <motion.span className="inline-block" {...rise(0.5)}>Photograph it.</motion.span><br />
          <motion.span className="inline-block bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg,#9FE8D0 0%,#9FE8D0 35%,#FFE2AA 50%,#9FE8D0 65%,#9FE8D0 100%)', backgroundSize: '250% 100%' }}
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)', backgroundPosition: '100% 0%' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', backgroundPosition: ['100% 0%', '-150% 0%'] }}
            transition={{ duration: 0.9, delay: 0.7, ease: EASE, backgroundPosition: { duration: 3.5, repeat: Infinity, repeatDelay: 3, delay: 1.8 } }}>
            Get a field report.
          </motion.span>
        </h1>

        <motion.p {...rise(0.9)} className="text-white/70 text-[13px] text-center mb-10 max-w-[260px] leading-relaxed">
          AI mineral ID, legal land access, and a collection worth keeping.
        </motion.p>

        {/* Two buttons */}
        <motion.div {...rise(1.1)} className="w-full max-w-xs space-y-3">
          <Link
            to="/scan"
            className="relative overflow-hidden w-full py-3.5 rounded-2xl font-bold text-[15px] text-center flex items-center justify-center transition active:scale-95"
            style={{
              background: '#9FE8D0',
              color: '#0a0a14',
              boxShadow: '0 4px 24px -6px rgba(159,232,208,0.4)',
            }}
          >
            <motion.span aria-hidden className="absolute inset-y-0 -left-1/3 w-1/3 pointer-events-none"
              style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)' }}
              animate={{ x: ['0%', '450%'] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut', delay: 2 }} />
            <span className="relative">Scan one free</span>
          </Link>
          <button
            type="button"
            onClick={() => base44.auth.loginWithProvider('google', '/')}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white/80 text-center flex items-center justify-center gap-2 transition active:scale-95 hover:text-white"
            style={{
              background: 'hsla(0,0%,100%,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <GoogleIcon className="w-4 h-4" /> Continue with Google
          </button>
          <Link
            to="/signin"
            onClick={() => {
              try {
                localStorage.setItem('rhgo_gate_choice', 'returning');
                sessionStorage.removeItem('rhgo_gate_session_redirect');
              } catch { /* */ }
            }}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white/90 text-center flex items-center justify-center transition active:scale-95 hover:text-white"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Sign in with email
          </Link>
          {/* Privacy + Terms — accessible without account */}
          <div className="flex items-center justify-center gap-3 pt-1 text-white/60 text-[11px]">
            <Link to="/privacy-policy" className="hover:text-white/60 transition">Privacy</Link>
            <span className="text-white/15">·</span>
            <Link to="/terms" className="hover:text-white/60 transition">Terms</Link>
          </div>
        </motion.div>
      </div>

      </div>

      {/* ── TINY FOOTER ── */}
      <footer className="w-full px-6 pb-8 pt-4 flex flex-col items-center justify-center gap-3 text-white/60 text-[11px] relative z-10">
        <Link to="/pricing" className="hover:text-white/60 transition">Pricing</Link>
        <GrokBotBadge />
      </footer>
    </div>
  );
}