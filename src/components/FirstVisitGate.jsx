import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import IntroOrb from '@/components/hub/IntroOrb.jsx';
import { base44 } from '@/api/base44Client';
import GoogleIcon from '@/components/GoogleIcon';

/**
 * FirstVisitGate — first screen for unauthenticated visitors on `/`.
 * Prefer real <Link> to /login so sign-in is never blocked by gate state.
 */
export default function FirstVisitGate({ onChoice }) {
  const [name, setName] = useState('');
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthError, setOauthError] = useState('');

  const handleBegin = () => {
    const trimmed = name.trim().slice(0, 30) || 'Explorer';
    onChoice('new', trimmed);
  };

  const handleGoogle = async () => {
    if (oauthBusy) return;
    setOauthError('');
    setOauthBusy(true);
    const trimmed = name.trim().slice(0, 30);
    if (trimmed) {
      try { localStorage.setItem('rhgo_user_name', trimmed); } catch { /* */ }
    }
    onChoice('google', trimmed);
    try {
      await Promise.resolve(base44.auth.loginWithProvider('google', '/'));
    } catch (err) {
      setOauthBusy(false);
      setOauthError(err?.message || 'Google sign-in failed. Try email login.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-8 overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, hsl(265 50% 12%) 0%, hsl(245 35% 4%) 100%)' }}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: 1 + (i % 3) * 0.5,
            height: 1 + (i % 3) * 0.5,
          }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2 + (i % 5), delay: (i % 7) * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm flex flex-col items-center gap-6 relative z-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <IntroOrb size={72} />
        </motion.div>

        <div className="text-center">
          <h1 className="text-white font-bold text-xl tracking-tight">Welcome to RockHound-GO</h1>
          <p className="text-white/50 text-[14px] font-light mt-1.5">
            Scan a rock in seconds — name is optional.
          </p>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleBegin(); }}
          maxLength={30}
          placeholder="Name (optional)"
          aria-label="Your name"
          autoFocus
          className="w-full px-5 py-4 rounded-2xl text-white text-center text-base font-medium outline-none placeholder:text-white/25 focus-visible:ring-2 focus-visible:ring-amethyst-glow"
          style={{
            background: 'hsla(255, 30%, 12%, 0.7)',
            border: '1px solid hsla(280, 80%, 65%, 0.4)',
            boxShadow: '0 0 24px hsla(280, 80%, 50%, 0.15), inset 0 1px 0 hsla(280, 80%, 90%, 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        />

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={handleBegin}
          className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{
            background: 'linear-gradient(135deg, hsla(280, 80%, 50%, 0.85), hsla(265, 70%, 40%, 0.9))',
            boxShadow: '0 0 30px hsla(280, 80%, 50%, 0.3)',
            border: '1px solid hsla(280, 80%, 65%, 0.4)',
          }}
        >
          Start hunting
        </motion.button>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthBusy}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <GoogleIcon className="w-4 h-4" />
          {oauthBusy ? 'Connecting…' : 'Continue with Google'}
        </button>

        {oauthError && (
          <p className="text-red-300 text-[12px] text-center leading-snug">{oauthError}</p>
        )}

        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-[11px] uppercase tracking-[0.2em]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Hard navigation — never depends on gate callbacks */}
        <Link
          to="/login"
          onClick={() => {
            try { localStorage.setItem('rhgo_gate_choice', 'returning'); } catch { /* */ }
          }}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center border border-white/20 bg-white/5 hover:bg-white/10 transition"
        >
          I already have an account — Sign in
        </Link>

        <button
          type="button"
          onClick={() => onChoice('guest')}
          className="text-white/35 text-[12px] font-medium hover:text-white/60 transition mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow rounded px-2 py-1"
        >
          Just scan one first — no account
        </button>
      </motion.div>
    </div>
  );
}
