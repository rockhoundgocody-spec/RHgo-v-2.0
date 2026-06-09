import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ScanLine, Gem, Trophy, MapPin, Zap } from 'lucide-react';

const FEATURES = [
  { icon: ScanLine, title: 'AI Mineral Scanner', desc: 'Point your camera at any rock — our AI IDs it in seconds with confidence scores.', color: 'text-amethyst-glow', bg: 'bg-amethyst/10', border: 'border-amethyst/20' },
  { icon: MapPin, title: 'Hotspot Explorer', desc: 'Discover thousands of real collecting sites mapped by rockhounds worldwide.', color: 'text-hud-cyan', bg: 'bg-hud-cyan/10', border: 'border-hud-cyan/20' },
  { icon: Gem, title: 'Digital Collection', desc: 'Log, organize, and track every specimen you find with photos and GPS coords.', color: 'text-purple-300', bg: 'bg-purple-900/20', border: 'border-purple-400/20' },
  { icon: Trophy, title: 'XP & Badges', desc: 'Level up from Pebble Scout to Mythic Earth Wizard. Earn rare badges for epic finds.', color: 'text-yellow-300', bg: 'bg-yellow-900/20', border: 'border-yellow-400/20' },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center pb-16 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at top, hsl(265 55% 38%) 0%, hsl(250 30% 28%) 45%, hsl(245 25% 22%) 100%)' }}
      />
      <div className="fixed inset-0 -z-10 opacity-40"
        style={{ backgroundImage: 'radial-gradient(circle at 15% 85%, hsla(280,100%,60%,0.18) 0%, transparent 50%), radial-gradient(circle at 85% 15%, hsla(195,100%,60%,0.12) 0%, transparent 50%)' }}
      />

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-5 pt-14 pb-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-5xl">🪨</span>
          <div className="text-left">
            <div className="text-white font-black text-3xl tracking-tight leading-none">RockHound</div>
            <div className="font-black text-3xl tracking-tight leading-none" style={{ color: 'hsl(280,100%,85%)' }}>GO</div>
          </div>
        </div>

        <h1 className="text-white font-black text-4xl leading-tight mb-3" style={{ textShadow: '0 0 40px hsla(280,100%,75%,0.4)' }}>
          The Game for<br />
          <span style={{ color: 'hsl(280,100%,85%)' }}>Real Rockhounds</span>
        </h1>
        <p className="text-white/50 text-base leading-relaxed mb-8 max-w-xs">
          Scan minerals with AI, discover hidden hotspots, build your collection, and level up in the real world.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            to="/register"
            className="w-full py-4 rounded-2xl font-black text-white text-base text-center transition active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(265,70%,55%), hsl(280,90%,65%))',
              boxShadow: '0 6px 30px -6px hsla(270,80%,60%,0.6)',
            }}
          >
            Start Playing Free →
          </Link>
          <Link
            to="/login"
            className="w-full py-3.5 rounded-2xl font-bold text-white/70 text-sm text-center border border-white/15 hover:bg-white/5 transition active:scale-95"
          >
            Already a Rockhound? Log in
          </Link>
        </div>

        <p className="text-white/25 text-xs mt-4">Free forever · No credit card · Works on any phone</p>
      </section>

      {/* Social proof */}
      <div className="flex items-center gap-2 px-5 mb-8">
        <div className="flex -space-x-2">
          {['🧑','👩','🧔','👧','🧑'].map((e, i) => (
            <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-background"
              style={{ background: `hsla(${260 + i * 20},60%,30%,0.8)` }}>
              {e}
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs">Thousands of rockhounds already exploring</p>
      </div>

      {/* Features */}
      <div className="w-full max-w-md px-4 space-y-3">
        {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }) => (
          <div key={title} className={`flex gap-4 p-4 rounded-2xl ${bg} border ${border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} border ${border}`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className={`font-bold text-sm ${color} mb-0.5`}>{title}</div>
              <div className="text-white/45 text-xs leading-relaxed">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div className="w-full max-w-md px-4 mt-8">
        <Link
          to="/register"
          className="w-full py-4 rounded-2xl font-black text-white text-base text-center flex items-center justify-center gap-2 transition active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(265,70%,55%), hsl(280,90%,65%))',
            boxShadow: '0 6px 30px -6px hsla(270,80%,60%,0.5)',
          }}
        >
          <Zap size={18} /> Join the Hunt — It's Free
        </Link>
      </div>
    </div>
  );
}