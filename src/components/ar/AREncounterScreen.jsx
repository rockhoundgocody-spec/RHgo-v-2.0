/**
 * AREncounterScreen — full-screen Pokémon GO-style mineral catch screen.
 * Uses device camera + canvas overlay for the "AR" feel.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Star, Award, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { RARITY_XP_MAP } from '@/lib/spawnEngine';

const RARITY_THEMES = {
  common:    { bg: 'hsla(215,35%,25%,0.9)',  glow: 'hsl(215,35%,68%)',  ring: '#94a3b8', label: 'COMMON'    },
  uncommon:  { bg: 'hsla(152,50%,20%,0.9)',  glow: 'hsl(152,70%,52%)',  ring: '#34d399', label: 'UNCOMMON'  },
  rare:      { bg: 'hsla(195,80%,18%,0.9)',  glow: 'hsl(195,100%,68%)', ring: '#22d3ee', label: 'RARE'      },
  legendary: { bg: 'hsla(40,80%,18%,0.9)',   glow: 'hsl(45,100%,62%)',  ring: '#fbbf24', label: 'LEGENDARY' },
};

const CATCH_MESSAGES = {
  success:   ['Gotcha! Added to your collection! 🎉', 'Nice catch! 💎', 'Amazing find! Added to Geo-DEX!'],
  critical:  ['LEGENDARY CATCH! Maximum XP! 🏆✨', 'PERFECT! Critical catch! ⚡'],
  escape:    ['It slipped away…', 'So close! Try again.', 'The specimen crumbled away…'],
  shiny:     ['✨ SHINY! Ultra rare variant! 2× XP! ✨'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function AREncounterScreen({ spawn, onCatch, onDismiss }) {
  const [phase, setPhase] = useState('encounter'); // encounter | throwing | result
  const [result, setResult] = useState(null); // success | critical | escape | shiny
  const [throwCount, setThrowCount] = useState(0);
  const [orbScale, setOrbScale] = useState(1);
  const [particles, setParticles] = useState([]);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const orbRef = useRef(null);
  const theme = RARITY_THEMES[spawn.rarity] || RARITY_THEMES.common;

  // Start camera for AR feel
  useEffect(() => {
    let stream;
    navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        setCameraStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {});
    return () => { stream?.getTracks?.().forEach(t => t.stop()); };
  }, []);

  // Orb idle animation
  useEffect(() => {
    if (phase !== 'encounter') return;
    const interval = setInterval(() => {
      setOrbScale(s => s === 1 ? 1.06 : 1);
    }, 1200);
    return () => clearInterval(interval);
  }, [phase]);

  const spawnParticles = useCallback((count, color) => {
    const newP = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      color,
      life: 1,
    }));
    setParticles(p => [...p, ...newP]);
    setTimeout(() => setParticles(p => p.filter(x => !newP.find(n => n.id === x.id))), 1500);
  }, []);

  const handleThrow = useCallback(async () => {
    if (phase !== 'encounter') return;
    setPhase('throwing');
    setThrowCount(c => c + 1);

    await new Promise(r => setTimeout(r, 800));

    const roll = Math.random();
    const catchChance = spawn.catch_chance + throwCount * 0.05;

    let outcome;
    if (spawn.is_shiny) {
      outcome = roll < Math.min(catchChance + 0.2, 0.95) ? 'shiny' : 'escape';
    } else if (roll < catchChance * 0.15) {
      outcome = 'critical';
    } else if (roll < catchChance) {
      outcome = 'success';
    } else {
      outcome = throwCount >= 2 ? 'success' : 'escape'; // mercy on 3rd throw
    }

    setResult(outcome);
    setPhase('result');

    if (outcome !== 'escape') {
      spawnParticles(outcome === 'critical' || outcome === 'shiny' ? 28 : 14, theme.glow);
      const xp = RARITY_XP_MAP[spawn.rarity] * (outcome === 'shiny' || outcome === 'critical' ? 2 : 1);
      // Save to collection
      try {
        const me = await base44.auth.me();
        await base44.entities.Specimen.create({
          mineral_name: spawn.mineral_name,
          rarity: spawn.rarity,
          ai_confidence: spawn.rarity === 'legendary' ? 0.95 : 0.80,
          notes: `AR catch · ${spawn.is_shiny ? 'SHINY · ' : ''}${xp} XP · ${new Date().toLocaleDateString()}`,
          found_date: new Date().toISOString().slice(0, 10),
          xp_awarded: xp,
        });
        // Award XP to player profile
        const profiles = await base44.entities.PlayerProfile.filter({ owner_email: me.email }, '-created_date', 1);
        if (profiles[0]) {
          await base44.entities.PlayerProfile.update(profiles[0].id, {
            total_xp: (profiles[0].total_xp || 0) + xp,
          });
        }
      } catch {}
      onCatch?.(spawn, outcome);
    }
  }, [phase, spawn, throwCount, theme.glow, onCatch, spawnParticles]);

  const handleSwipe = useCallback((e) => {
    e.preventDefault();
    if (phase === 'encounter') handleThrow();
  }, [phase, handleThrow]);

  const xp = RARITY_XP_MAP[spawn.rarity] * (spawn.is_shiny || result === 'critical' ? 2 : 1);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden"
      style={{ background: '#040810' }}
    >
      {/* Camera background */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-40" muted playsInline />

      {/* Radial overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 60%, ${theme.bg} 0%, hsla(240,30%,4%,0.85) 70%)` }} />

      {/* Grid lines - Pokémon GO HUD feel */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `linear-gradient(${theme.ring}22 1px, transparent 1px), linear-gradient(90deg, ${theme.ring}22 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div key={p.id} className="absolute w-2 h-2 rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.color, boxShadow: `0 0 6px ${p.color}`, transform: 'translateX(-50%)' }} />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative w-full flex items-center justify-between px-5 pt-12 z-10">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: theme.glow }}>
            {theme.label}{spawn.is_shiny ? ' · ✨ SHINY' : ''}
          </div>
          <div className="text-xl font-black text-white">{spawn.mineral_name}</div>
        </div>
        <button onClick={onDismiss}
          className="w-10 h-10 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Close encounter"
          style={{ background: 'hsla(0,0%,0%,0.5)', border: '1px solid hsla(0,0%,100%,0.15)' }}>
          <X size={18} className="text-white/60" />
        </button>
      </div>

      {/* Center — floating mineral orb */}
      <div className="relative flex flex-col items-center justify-center flex-1 z-10">
        <AnimatePresence mode="wait">
          {phase !== 'result' && (
            <motion.div key="orb"
              animate={{ scale: orbScale, y: [0, -8, 0] }}
              transition={{ y: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }, scale: { duration: 0.4 } }}
              className="relative cursor-pointer select-none"
              style={{ width: 160, height: 160 }}
              onClick={handleThrow}
              onTouchEnd={handleSwipe}
            >
              {/* Glow rings */}
              {[1.8, 1.5, 1.25].map((scale, i) => (
                <div key={i} className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${theme.glow}${['18', '22', '28'][i]} 0%, transparent 65%)`,
                    transform: `scale(${scale})`,
                    animation: `badge-pulse-glow ${2 + i * 0.4}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }} />
              ))}
              {/* Crystal orb */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${theme.glow}cc, ${theme.glow}44 60%, transparent 80%)`,
                  border: `2px solid ${theme.ring}aa`,
                  boxShadow: `0 0 40px ${theme.glow}66, inset 0 2px 0 ${theme.ring}44`,
                }}>
                <span className="text-5xl select-none" role="img">{spawn.emoji}</span>
              </div>
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: `1px solid transparent`,
                  borderTopColor: theme.ring,
                  borderRightColor: `${theme.ring}44`,
                  animation: 'badge-halo-spin 3s linear infinite',
                }} />
            </motion.div>
          )}

          {phase === 'throwing' && (
            <motion.div key="throwing"
              initial={{ scale: 1.2, opacity: 1 }} animate={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl" style={{ fontSize: 64 }}>⛏️</motion.div>
          )}
        </AnimatePresence>

        {/* Rarity XP hint */}
        {phase === 'encounter' && (
          <div className="mt-8 flex items-center gap-2">
            <Zap size={13} style={{ color: theme.glow }} />
            <span className="text-sm font-bold" style={{ color: theme.glow }}>+{spawn.xp} XP</span>
            {spawn.is_shiny && <span className="text-xs text-yellow-300 font-bold animate-pulse">2× SHINY BONUS</span>}
          </div>
        )}
      </div>

      {/* Result card */}
      <AnimatePresence>
        {phase === 'result' && result && (
          <motion.div
            initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative w-full z-10 mx-4 mb-8"
          >
            <div className="mx-4 rounded-3xl p-5 text-center"
              style={{ background: result === 'escape' ? 'hsla(0,30%,10%,0.95)' : theme.bg, border: `1px solid ${theme.ring}44` }}>
              <div className="text-3xl mb-2">
                {result === 'escape' ? '💨' : result === 'critical' ? '⚡' : result === 'shiny' ? '✨' : '🎉'}
              </div>
              <div className="text-base font-black text-white mb-1">
                {pick(CATCH_MESSAGES[result] || CATCH_MESSAGES.success)}
              </div>
              {result !== 'escape' && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star size={14} style={{ color: theme.glow }} />
                  <span className="text-sm font-bold" style={{ color: theme.glow }}>+{xp} XP</span>
                  <span className="text-xs text-white/40">· Added to Geo-DEX</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                {result !== 'escape' ? (
                  <>
                    <button onClick={onDismiss}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold text-white/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      style={{ background: 'hsla(255,20%,20%,0.7)', border: '1px solid hsla(255,20%,40%,0.3)' }}>
                      Continue
                    </button>
                    <button onClick={() => {
                      const text = `I just caught a ${spawn.is_shiny ? '✨ SHINY ' : ''}${spawn.rarity} ${spawn.mineral_name} in RockHound-GO! +${xp} XP 🪨`;
                      navigator.share?.({ title: 'RockHound-GO Find!', text }) || navigator.clipboard?.writeText(text);
                    }}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      style={{ background: `${theme.glow}22`, border: `1px solid ${theme.ring}55`, color: theme.glow }}>
                      <Share2 size={14} /> Share
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setPhase('encounter'); setResult(null); }}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      style={{ background: `${theme.glow}22`, border: `1px solid ${theme.ring}55`, color: theme.glow }}>
                      Try Again
                    </button>
                    <button onClick={onDismiss}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold text-white/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      style={{ background: 'hsla(255,20%,15%,0.7)' }}>
                      Leave
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Throw instruction */}
      {phase === 'encounter' && (
        <div className="relative z-10 mb-32 text-center">
          <p className="text-white/40 text-xs uppercase tracking-[0.25em] animate-pulse">Tap or swipe up to throw Field Lens</p>
          <p className="text-white/20 text-[10px] mt-1">{spawn.rarity === 'legendary' ? '⚠️ Legendary — bonus answers improve catch chance' : `Catch chance: ${Math.round(spawn.catch_chance * 100)}%`}</p>
        </div>
      )}
    </motion.div>
  );
}