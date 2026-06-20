import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ScanLine, Gem, Trophy, MapPin, Zap, Shield, Users, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES = [
  {
    icon: ScanLine,
    title: 'AI Mineral Scanner',
    desc: 'Point your camera at any rock — our AI IDs it in seconds with confidence scores.',
    color: 'hsl(280,85%,82%)',
    glow: 'hsla(280,100%,65%,0.4)',
    border: 'hsla(280,70%,65%,0.18)',
    bg: 'hsla(270,60%,15%,0.45)',
  },
  {
    icon: MapPin,
    title: 'Hotspot Explorer',
    desc: 'Discover thousands of real collecting sites — BLM, state parks, river beds — mapped by rockhounds worldwide.',
    color: 'hsl(195,100%,78%)',
    glow: 'hsla(195,100%,60%,0.4)',
    border: 'hsla(195,90%,60%,0.18)',
    bg: 'hsla(210,60%,15%,0.45)',
  },
  {
    icon: Gem,
    title: 'Liquid Crystal GeoDex',
    desc: 'Log every specimen with GPS, weather, rarity, and lunar phase. Your personal gem codex.',
    color: 'hsl(290,70%,82%)',
    glow: 'hsla(290,80%,65%,0.4)',
    border: 'hsla(290,60%,65%,0.18)',
    bg: 'hsla(280,50%,15%,0.45)',
  },
  {
    icon: Trophy,
    title: 'XP, Quests & Badges',
    desc: 'Level up from Pebble Scout to Mythic Earth Wizard. Earn rare liquid mineral badges for epic finds.',
    color: 'hsl(45,90%,75%)',
    glow: 'hsla(45,90%,60%,0.4)',
    border: 'hsla(45,80%,60%,0.18)',
    bg: 'hsla(40,50%,10%,0.45)',
  },
  {
    icon: Shield,
    title: 'Stealth Mode & Privacy',
    desc: 'Keep your best spots secret. Stealth Mode hides exact coordinates — privacy is a first-class feature.',
    color: 'hsl(160,70%,70%)',
    glow: 'hsla(160,70%,50%,0.4)',
    border: 'hsla(160,60%,50%,0.18)',
    bg: 'hsla(160,40%,10%,0.45)',
  },
  {
    icon: Users,
    title: 'Family & Kids Mode',
    desc: 'Built for the whole family — child-safe accounts, parental dashboard, and COPPA-aware data practices.',
    color: 'hsl(20,90%,75%)',
    glow: 'hsla(20,90%,60%,0.4)',
    border: 'hsla(20,80%,60%,0.18)',
    bg: 'hsla(20,40%,10%,0.45)',
  },
];

const STATS = [
  { value: '250+', label: 'Minerals in Library' },
  { value: '1,400+', label: 'Hotspots Mapped' },
  { value: '98%', label: 'AI Accuracy' },
];

// Floating crystal particle
function CrystalParticle({ style }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-lg opacity-20"
      animate={{ y: [0, -18, 0], rotate: [0, 12, 0], opacity: [0.15, 0.35, 0.15] }}
      transition={{ duration: 5 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 3 }}
      style={style}
    >
      💎
    </motion.div>
  );
}

export default function Landing() {
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { setHeroVisible(true); }, []);

  return (
    <div className="min-h-screen flex flex-col items-center pb-20 relative overflow-hidden">
      {/* Deep crystal background */}
      <div className="fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(270 65% 22%) 0%, hsl(255 35% 14%) 40%, hsl(245 25% 8%) 100%)' }}
      />
      {/* Ambient light blooms */}
      <div className="fixed inset-0 -z-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, hsla(280,100%,55%,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 15%, hsla(195,100%,55%,0.10) 0%, transparent 50%), radial-gradient(circle at 50% 50%, hsla(265,80%,40%,0.08) 0%, transparent 70%)' }}
      />
      {/* Subtle grid */}
      <div className="fixed inset-0 -z-10 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(hsla(195,100%,60%,1) 1px,transparent 1px),linear-gradient(90deg,hsla(195,100%,60%,1) 1px,transparent 1px)', backgroundSize: '48px 48px' }}
      />

      {/* Floating crystals */}
      {[{ top: '8%', left: '5%' }, { top: '22%', right: '6%' }, { top: '55%', left: '8%' }, { top: '70%', right: '10%' }, { top: '38%', left: '3%' }].map((style, i) => (
        <CrystalParticle key={i} style={{ ...style, position: 'fixed', zIndex: 0 }} />
      ))}

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-16 pb-10 w-full max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: heroVisible ? 1 : 0, y: heroVisible ? 0 : 24 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center"
        >
          {/* Logo mark */}
          <div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.06, 1], filter: ['drop-shadow(0 0 20px hsla(280,100%,70%,0.5))', 'drop-shadow(0 0 40px hsla(280,100%,70%,0.8))', 'drop-shadow(0 0 20px hsla(280,100%,70%,0.5))'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
              style={{
                background: 'radial-gradient(circle at 35% 30%, hsla(280,80%,60%,0.35), hsla(265,60%,20%,0.5))',
                border: '1px solid hsla(280,70%,70%,0.3)',
                boxShadow: 'inset 0 1px 0 hsla(280,80%,95%,0.2), 0 0 60px hsla(280,100%,60%,0.25)',
                backdropFilter: 'blur(20px)',
              }}
            >
              🪨
            </motion.div>
            {/* Orbiting crystal ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: '1px dashed hsla(280,70%,65%,0.15)' }}
            />
          </div>

          <div className="text-white/35 text-[10px] uppercase tracking-[0.4em] mb-3 font-semibold">Built by collectors · for collectors</div>

          <h1 className="text-white font-black text-[44px] leading-[1.05] mb-4" style={{ letterSpacing: '-0.02em', textShadow: '0 0 60px hsla(280,100%,70%,0.5)' }}>
            The Game for<br />
            <span style={{ color: 'hsl(280,100%,88%)', textShadow: '0 0 80px hsla(280,100%,70%,0.7)' }}>Real Rockhounds</span>
          </h1>
          <p className="text-white/50 text-[15px] leading-relaxed mb-8 max-w-[280px]">
            AI mineral identification, geospatial discovery, gamified collecting, and voice-guided field intelligence — all in your pocket.
          </p>

          {/* Primary CTA */}
          <Link
            to="/register"
            className="w-full max-w-xs py-4 rounded-2xl font-black text-white text-base text-center flex items-center justify-center gap-2 transition active:scale-95 mb-3"
            style={{
              background: 'linear-gradient(135deg, hsl(265,70%,50%), hsl(280,90%,62%))',
              boxShadow: '0 8px 40px -8px hsla(270,80%,60%,0.65), inset 0 1px 0 hsla(280,80%,95%,0.2)',
            }}
          >
            <Zap size={17} /> Start Playing Free
          </Link>
          <Link
            to="/login"
            className="w-full max-w-xs py-3.5 rounded-2xl font-semibold text-white/55 text-sm text-center border transition active:scale-95"
            style={{ borderColor: 'hsla(280,40%,60%,0.2)', background: 'hsla(270,30%,15%,0.3)' }}
          >
            Already a Rockhound? Log in →
          </Link>
          <p className="text-white/20 text-[11px] mt-4">Free forever · No credit card · Works on any phone</p>
        </motion.div>
      </section>

      {/* ── STATS ROW ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full max-w-md px-6 mb-8 z-10"
      >
        <div className="grid grid-cols-3 gap-3">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center py-4 rounded-2xl"
              style={{ background: 'hsla(265,40%,15%,0.5)', border: '1px solid hsla(280,40%,50%,0.15)', backdropFilter: 'blur(12px)' }}>
              <div className="text-xl font-black text-amethyst-glow" style={{ textShadow: '0 0 20px hsla(280,100%,70%,0.5)' }}>{value}</div>
              <div className="text-white/35 text-[9px] uppercase tracking-[0.2em] mt-1 text-center leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── FEATURES ── */}
      <div className="w-full max-w-md px-4 space-y-3 z-10">
        {FEATURES.map(({ icon: Icon, title, desc, color, glow, border, bg }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
            className="flex gap-4 p-4 rounded-2xl"
            style={{ background: bg, border: `1px solid ${border}`, backdropFilter: 'blur(16px)' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${glow.replace('0.4', '0.15')}`, border: `1px solid ${border}`, boxShadow: `0 0 16px ${glow}` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div className="font-bold text-[13px] mb-0.5" style={{ color }}>{title}</div>
              <div className="text-white/45 text-[12px] leading-relaxed">{desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── SOCIAL PROOF ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col items-center gap-3 px-6 mt-10 mb-2 z-10"
      >
        <div className="flex -space-x-2 mb-1">
          {['🧑', '👩', '🧔', '👧', '🧑'].map((e, i) => (
            <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-background"
              style={{ background: `hsla(${260 + i * 20},60%,25%,0.9)` }}>
              {e}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-400" fill="#facc15" />)}
        </div>
        <p className="text-white/35 text-xs text-center max-w-[220px]">"Best rockhounding app I've used. Clover actually knows her minerals."</p>
      </motion.div>

      {/* ── FINAL CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="w-full max-w-md px-4 mt-8 z-10"
      >
        <Link
          to="/register"
          className="w-full py-4 rounded-2xl font-black text-white text-base text-center flex items-center justify-center gap-2 transition active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(265,70%,50%), hsl(280,90%,62%))',
            boxShadow: '0 8px 40px -8px hsla(270,80%,60%,0.55), inset 0 1px 0 hsla(280,80%,95%,0.2)',
          }}
        >
          <Zap size={17} /> Join the Hunt — It's Free <ChevronRight size={16} />
        </Link>
      </motion.div>
    </div>
  );
}