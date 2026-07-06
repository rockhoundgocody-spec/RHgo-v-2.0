/**
 * Demo — "Try Full Demo (No Sign-Up)" guest experience.
 * Shows a mock dashboard with map, scanner, and collection grid.
 * No auth required.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, MapPin, Gem, Zap, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_SPECIMENS = [
  { name: 'Amethyst', rarity: 'rare', emoji: '💜', conf: 94, location: 'Lake Superior, MI' },
  { name: 'Quartz Crystal', rarity: 'common', emoji: '🔮', conf: 98, location: 'Shawnee Hills, IL' },
  { name: 'Petoskey Stone', rarity: 'uncommon', emoji: '🪨', conf: 87, location: 'Petoskey, MI' },
  { name: 'Calcite', rarity: 'common', emoji: '⬜', conf: 91, location: 'Cave-in-Rock, IL' },
  { name: 'Tourmaline', rarity: 'rare', emoji: '🟢', conf: 79, location: 'Grafton, IL' },
  { name: 'Pyrite', rarity: 'uncommon', emoji: '✨', conf: 95, location: 'Galena, IL' },
];

const RARITY_COLORS = {
  common:   { color: '#94a3b8', bg: 'hsla(215,20%,30%,0.4)', border: 'hsla(215,20%,50%,0.2)' },
  uncommon: { color: '#34d399', bg: 'hsla(160,60%,15%,0.4)', border: 'hsla(160,60%,40%,0.25)' },
  rare:     { color: '#c084fc', bg: 'hsla(270,60%,15%,0.4)', border: 'hsla(270,60%,50%,0.25)' },
};

function ScannerMock() {
  const [phase, setPhase] = useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);
  const phases = ['SCANNING', 'ANALYZING', 'MATCHING', '✓ AMETHYST'];
  const done = phase === 3;
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border"
      style={{ background: 'hsla(240,30%,6%,0.9)', border: '1px solid hsla(195,100%,60%,0.3)', minHeight: 160 }}>
      <div className="flex items-center justify-center py-8">
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-sky-400/40 bg-black/40 flex items-center justify-center text-5xl">
          🪨
          {!done && (
            <motion.div
              animate={{ y: ['0%', '100%', '0%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-x-0 h-0.5 bg-sky-400"
              style={{ top: 0, boxShadow: '0 0 8px 2px rgba(56,189,248,0.7)' }}
            />
          )}
          {done && (
            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">💜</span>
            </div>
          )}
        </div>
      </div>
      <div className={`text-center pb-4 font-mono text-xs tracking-widest font-bold transition-colors ${done ? 'text-purple-300' : 'text-sky-300'}`}>
        {phases[phase]}
        {done && <div className="text-white/40 text-[10px] mt-1 font-normal tracking-normal">Confidence: 94% · Rare</div>}
      </div>
    </div>
  );
}

export default function Demo() {
  const [tab, setTab] = useState('collection');

  return (
    <div className="min-h-screen flex flex-col pb-24"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(270 65% 22%) 0%, hsl(255 35% 14%) 40%, hsl(245 25% 8%) 100%)' }}>

      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'hsla(250,30%,10%,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid hsla(270,30%,30%,0.2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪨</span>
          <div>
            <div className="text-white font-black text-sm leading-none">RockHound<span style={{ color: 'hsl(280,85%,82%)' }}>GO</span></div>
            <div className="text-[9px] uppercase tracking-widest text-white/30">Guest Demo</div>
          </div>
        </div>
        <Link to="/register"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-white text-xs"
          style={{ background: 'linear-gradient(135deg, hsl(265,70%,50%), hsl(280,90%,62%))' }}>
          <Zap size={11} /> Get Full Access
        </Link>
      </div>

      {/* Demo notice banner */}
      <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2"
        style={{ background: 'hsla(45,80%,50%,0.12)', border: '1px solid hsla(45,80%,55%,0.25)' }}>
        <Lock size={12} className="text-amber-400 shrink-0" />
        <p className="text-amber-300/80 text-[11px]">Demo mode — data is simulated. <Link to="/register" className="underline font-semibold">Sign up free</Link> to save real finds.</p>
      </div>

      {/* Tab bar */}
      <div className="flex mx-4 mt-4 gap-2">
        {[
          { id: 'collection', label: 'Collection', icon: Gem },
          { id: 'scanner', label: 'AI Scanner', icon: ScanLine },
          { id: 'map', label: 'Map', icon: MapPin },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: tab === id ? 'hsla(270,60%,40%,0.35)' : 'hsla(255,25%,14%,0.5)',
              border: `1px solid ${tab === id ? 'hsla(280,70%,60%,0.4)' : 'hsla(255,25%,30%,0.2)'}`,
              color: tab === id ? 'hsl(280,85%,82%)' : 'rgba(255,255,255,0.4)',
            }}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 mt-4">
        {tab === 'collection' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-black text-sm">My GeoDex</h2>
              <span className="text-white/30 text-xs">{MOCK_SPECIMENS.length} specimens</span>
            </div>
            {MOCK_SPECIMENS.map((s, i) => {
              const style = RARITY_COLORS[s.rarity];
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl"
                    style={{ background: 'hsla(255,25%,10%,0.5)' }}>{s.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{s.name}</div>
                    <div className="text-white/35 text-[10px] truncate">{s.location}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-bold" style={{ color: style.color }}>{s.rarity}</div>
                    <div className="text-white/30 text-[9px]">{s.conf}% match</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {tab === 'scanner' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-white font-black text-sm mb-3">AI Field Scanner</h2>
            <ScannerMock />
            <div className="px-4 py-4 rounded-2xl" style={{ background: 'hsla(270,50%,14%,0.5)', border: '1px solid hsla(280,50%,40%,0.2)' }}>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Last Result</div>
              <div className="text-white font-black text-lg">💜 Amethyst</div>
              <div className="text-white/50 text-xs mt-1">SiO₂ with Fe impurities · Hexagonal · Hardness 7</div>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'hsla(270,60%,30%,0.5)', color: '#c084fc', border: '1px solid hsla(270,60%,50%,0.2)' }}>Rare</span>
                <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'hsla(215,40%,20%,0.5)', color: '#94a3b8', border: '1px solid hsla(215,30%,40%,0.2)' }}>94% Confidence</span>
              </div>
            </div>
            <Link to="/register"
              className="w-full py-3 rounded-2xl font-bold text-white text-sm text-center flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, hsl(265,70%,50%), hsl(280,90%,62%))' }}>
              Scan Real Rocks → Sign Up Free <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}

        {tab === 'map' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-white font-black text-sm mb-3">Hotspot Explorer</h2>
            <div className="relative w-full rounded-2xl overflow-hidden"
              style={{ height: 240, background: 'hsla(215,40%,8%,0.9)', border: '1px solid hsla(195,100%,60%,0.2)' }}>
              {/* Fake map grid */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'linear-gradient(hsla(160,60%,50%,0.5) 1px,transparent 1px),linear-gradient(90deg,hsla(160,60%,50%,0.5) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
              {/* Mock pins */}
              {[
                { x: '35%', y: '40%', label: 'Lake Superior', color: '#c084fc' },
                { x: '60%', y: '55%', label: 'Galena, IL', color: '#fbbf24' },
                { x: '22%', y: '65%', label: 'Shawnee Hills', color: '#34d399' },
              ].map((pin, i) => (
                <motion.div key={i}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute flex flex-col items-center"
                  style={{ left: pin.x, top: pin.y, transform: 'translate(-50%,-50%)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: pin.color, boxShadow: `0 0 10px ${pin.color}` }} />
                  <div className="text-[8px] mt-1 font-semibold whitespace-nowrap" style={{ color: pin.color }}>{pin.label}</div>
                </motion.div>
              ))}
              <div className="absolute bottom-3 inset-x-0 text-center text-white/25 text-[10px] uppercase tracking-widest">
                1,400+ hotspots mapped
              </div>
            </div>
            <Link to="/register"
              className="w-full py-3 rounded-2xl font-bold text-white text-sm text-center flex items-center justify-center gap-2 mt-4"
              style={{ background: 'linear-gradient(135deg, hsl(195,80%,35%), hsl(195,100%,45%))' }}>
              Explore Real Map → Sign Up Free <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 px-4 pb-6 pt-3 z-50"
        style={{ background: 'linear-gradient(to top, hsla(245,25%,8%,1) 60%, transparent)' }}>
        <Link to="/register"
          className="w-full max-w-md mx-auto py-4 rounded-2xl font-black text-white text-base text-center flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, hsl(265,70%,50%), hsl(280,90%,62%))', boxShadow: '0 8px 40px -8px hsla(270,80%,60%,0.65)' }}>
          <Zap size={17} /> Start Playing Free — Keep Your Finds
        </Link>
        <p className="text-center text-white/20 text-[10px] mt-2">No credit card · Free forever · Works offline</p>
      </div>
    </div>
  );
}