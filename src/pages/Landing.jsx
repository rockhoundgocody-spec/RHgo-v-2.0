import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import GoogleIcon from '@/components/GoogleIcon';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';
import GeodesicOrbBackground from '@/components/visuals/GeodesicOrbBackground';

const HERO_IMG = 'https://media.base44.com/images/public/69f35dd14650b54681c835ec/e29b0b8c6_generated_image.png';

/**
 * Landing — the public gate.
 * One photo. One line. Two buttons. No paywall.
 * Dark #0a0a14, mint #9FE8D0 for action only.
 */
export default function Landing() {
  useSeoRobots(true);
  useSeoMeta(
    'RockHound-GO — Photograph it. Get a field report.',
    'AI mineral identification, legal land access, and a collection worth keeping. Built by collectors, for collectors.'
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden"
      style={{ background: '#0a0a14' }}>

      {/* Geodesic orb background — drifting glowing spheres */}
      <GeodesicOrbBackground />

      {/* ── HERO ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-md relative z-10">

        {/* One photo of a real find */}
        <div className="relative w-full max-w-xs mb-8">
          <div className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 60px -10px rgba(159,232,208,0.15), 0 20px 60px -20px rgba(0,0,0,0.8)' }}>
            <img src={HERO_IMG} alt="Amethyst crystal specimen" className="w-full h-auto block" />
            {/* Subtle bottom fade into the page */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, #0a0a14)' }} />
          </div>
        </div>

        {/* One line */}
        <h1 className="text-white font-black text-[28px] leading-[1.1] text-center mb-2"
          style={{ letterSpacing: '-0.02em' }}>
          Photograph it.<br />
          <span style={{ color: '#9FE8D0' }}>Get a field report.</span>
        </h1>

        <p className="text-white/40 text-[13px] text-center mb-10 max-w-[260px] leading-relaxed">
          AI mineral ID, legal land access, and a collection worth keeping.
        </p>

        {/* Two buttons */}
        <div className="w-full max-w-xs space-y-3">
          <Link
            to="/scan"
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-center flex items-center justify-center transition active:scale-95"
            style={{
              background: '#9FE8D0',
              color: '#0a0a14',
              boxShadow: '0 4px 24px -6px rgba(159,232,208,0.4)',
            }}
          >
            Scan one free
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
            to="/login"
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white/70 text-center flex items-center justify-center transition active:scale-95 hover:text-white"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Sign in with email
          </Link>
          {/* Privacy + Terms — accessible without account */}
          <div className="flex items-center justify-center gap-3 pt-1 text-white/30 text-[11px]">
            <Link to="/privacy-policy" className="hover:text-white/60 transition">Privacy</Link>
            <span className="text-white/15">·</span>
            <Link to="/terms" className="hover:text-white/60 transition">Terms</Link>
          </div>
        </div>
      </div>

      {/* ── TINY FOOTER ── */}
      <footer className="w-full px-6 pb-8 pt-4 flex items-center justify-center text-white/30 text-[11px] relative z-10">
        <Link to="/pricing" className="hover:text-white/60 transition">Pricing</Link>
      </footer>
    </div>
  );
}