import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, Package, Shield, Star, Users } from 'lucide-react';

// ── Path definitions — the two legends ──────────────────────────────────────
const PATHS = {
  chattel: {
    key: 'chattel',
    emoji: '⛏️',
    archetype: 'The Collector',
    archetypeColor: '#f59e0b',
    archetypeBg: 'hsla(38,80%,18%,0.6)',
    archetypeBorder: 'hsla(38,90%,55%,0.45)',
    archetypeGlow: 'hsla(38,90%,55%,0.3)',
    title: 'Claim It',
    titleSub: 'This goes in my hoard.',
    storyLine: 'You found it. You earned it. It travels with you now — a piece of the Earth in your hands, your shelf, your story.',
    mechanics: [
      { icon: Package,  text: 'Joins your personal Hoard' },
      { icon: Star,     text: 'Unlocks Hoard Power multipliers' },
      { icon: Sparkles, text: 'Provenance badge on every trade' },
    ],
    xpBonus: '+120 XP',
    bonusLabel: 'Hoard Power',
    ctaText: 'Claim This Find',
    whisper: '"I pulled this from the Earth myself."',
    confirmColor: '#f59e0b',
    confirmGlow: 'hsla(38,90%,55%,0.5)',
    confirmBg: 'linear-gradient(135deg, hsla(38,90%,30%,0.9) 0%, hsla(38,80%,22%,0.95) 100%)',
    pillarBadge: 'AUTONOMY',
    pillarColor: '#fbbf24',
  },
  affixed: {
    key: 'affixed',
    emoji: '🌍',
    archetype: 'The Steward',
    archetypeColor: '#34d399',
    archetypeBg: 'hsla(160,60%,10%,0.6)',
    archetypeBorder: 'hsla(160,70%,45%,0.45)',
    archetypeGlow: 'hsla(160,70%,45%,0.3)',
    title: 'Log It in Place',
    titleSub: 'This pin belongs to everyone.',
    storyLine: 'You leave it, but you own the discovery. Your GPS pin lives in the Atlas forever. The next explorer will see your name on this vein.',
    mechanics: [
      { icon: MapPin,   text: 'Permanent pin on the living Atlas' },
      { icon: Users,    text: 'Earns "Steward of the Vein" title' },
      { icon: Shield,   text: 'Builds your Conservationist legacy' },
    ],
    xpBonus: '+120 XP',
    bonusLabel: 'Atlas Karma',
    ctaText: 'Leave My Mark',
    whisper: '"This vein will outlast my hoard."',
    confirmColor: '#34d399',
    confirmGlow: 'hsla(160,70%,45%,0.5)',
    confirmBg: 'linear-gradient(135deg, hsla(160,60%,18%,0.9) 0%, hsla(160,50%,10%,0.95) 100%)',
    pillarBadge: 'RELATEDNESS',
    pillarColor: '#6ee7b7',
  },
};

// ── Particle spark component ─────────────────────────────────────────────────
function PathGlow({ color, active }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 280;
    const H = canvas.height = 320;

    const spawn = () => {
      const angle = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 30;
      particlesRef.current.push({
        x: W / 2 + Math.cos(angle) * r,
        y: H * 0.38 + Math.sin(angle) * r * 0.5,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.4 - Math.random() * 1.2,
        life: 1,
        decay: 0.018 + Math.random() * 0.012,
        size: 1.5 + Math.random() * 2.5,
      });
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t++;
      if (t % 3 === 0) spawn();
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frameRef.current);
      particlesRef.current = [];
    };
  }, [active, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', opacity: active ? 1 : 0, transition: 'opacity 0.3s' }}
    />
  );
}

// ── Path Card ───────────────────────────────────────────────────────────────
function PathCard({ path, selected, onSelect }) {
  const isSelected = selected === path.key;
  const isDimmed = selected && selected !== path.key;

  return (
    <motion.button
      onClick={() => onSelect(path.key)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative flex flex-col text-left rounded-2xl overflow-hidden w-full transition-all"
      style={{
        background: path.archetypeBg,
        border: `1px solid ${isSelected ? path.archetypeColor : path.archetypeBorder}`,
        boxShadow: isSelected
          ? `0 0 32px -4px ${path.archetypeGlow}, 0 0 0 2px ${path.archetypeColor}55`
          : `0 0 16px -8px ${path.archetypeGlow}`,
        opacity: isDimmed ? 0.45 : 1,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Particle layer */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <PathGlow color={path.archetypeColor} active={isSelected} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl leading-none mb-1.5">{path.emoji}</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: path.archetypeColor }}>
              {path.archetype}
            </div>
          </div>
          <div
            className="text-[8px] font-bold uppercase tracking-[0.25em] px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: `${path.archetypeColor}18`, color: path.archetypeColor, border: `1px solid ${path.archetypeColor}33` }}
          >
            {path.pillarBadge}
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="text-white font-black text-lg leading-tight">{path.title}</div>
          <div className="text-white/50 text-xs mt-0.5">{path.titleSub}</div>
        </div>

        {/* Story line */}
        <p className="text-white/65 text-[11px] leading-relaxed border-l-2 pl-3"
          style={{ borderColor: `${path.archetypeColor}55` }}>
          {path.storyLine}
        </p>

        {/* Mechanics */}
        <div className="space-y-1.5">
          {path.mechanics.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${path.archetypeColor}18` }}>
                <Icon size={10} style={{ color: path.archetypeColor }} />
              </div>
              <span className="text-white/60 text-[10px]">{text}</span>
            </div>
          ))}
        </div>

        {/* XP chip */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: `${path.archetypeColor}20`, color: path.archetypeColor, border: `1px solid ${path.archetypeColor}44` }}>
            {path.xpBonus} · {path.bonusLabel}
          </div>
        </div>

        {/* Whisper */}
        <div className="text-[10px] italic font-medium text-white/30">{path.whisper}</div>
      </div>

      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center z-20"
            style={{ background: path.archetypeColor }}
          >
            <Sparkles size={10} className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function ClaimPathModal({ open, onChoose, onClose, isFragileSite = false }) {
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const selectedPath = selected ? PATHS[selected] : null;

  // Reset on open
  useEffect(() => {
    if (open) { setSelected(null); setConfirming(false); }
  }, [open]);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    // Short dramatic pause before triggering
    setTimeout(() => onChoose(selected), 420);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 60%, hsla(270,60%,8%,0.92) 0%, hsla(240,40%,2%,0.97) 100%)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
            initial={{ y: 80, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              background: 'linear-gradient(160deg, hsla(270,25%,8%,0.98) 0%, hsla(240,20%,5%,0.99) 100%)',
              border: '1px solid hsla(270,40%,35%,0.3)',
              boxShadow: '0 0 80px -10px hsla(270,80%,25%,0.6), 0 32px 80px rgba(0,0,0,0.8)',
              maxHeight: '96dvh',
              overflowY: 'auto',
            }}
          >
            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white/25 hover:text-white/60 transition"
              style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.08)' }}>
              <X size={14} />
            </button>

            {/* Header */}
            <div className="px-5 pt-6 pb-4 text-center">
              <div className="text-[9px] font-bold uppercase tracking-[0.4em] mb-2"
                style={{ color: 'hsla(280,80%,70%,0.6)' }}>
                ✦ A Legend is Made in This Moment ✦
              </div>
              <h2 className="text-white font-black text-xl leading-tight">
                What kind of rockhound<br />are you?
              </h2>
              <p className="text-white/35 text-xs mt-2 leading-relaxed max-w-[280px] mx-auto">
                Both paths earn equal XP. Both feed the Atlas.<br />
                Only one tells the story you want to live.
              </p>

              {isFragileSite && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 text-[10px] text-amber-300/80 bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2"
                >
                  <Shield size={11} className="text-amber-400 shrink-0" />
                  <span>Fragile site detected — the Earth remembers stewards here.</span>
                </motion.div>
              )}
            </div>

            {/* Path cards */}
            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
              {Object.values(PATHS).map((path) => (
                <PathCard
                  key={path.key}
                  path={path}
                  selected={selected}
                  onSelect={setSelected}
                />
              ))}
            </div>

            {/* Confirm strip — only shows once selected */}
            <AnimatePresence>
              {selectedPath && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="px-4 pb-5"
                >
                  <motion.button
                    onClick={handleConfirm}
                    disabled={confirming}
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-white flex items-center justify-center gap-2.5 disabled:opacity-60 transition-opacity"
                    style={{
                      background: selectedPath.confirmBg,
                      border: `1px solid ${selectedPath.archetypeColor}55`,
                      boxShadow: `0 0 32px -4px ${selectedPath.confirmGlow}, inset 0 1px 0 ${selectedPath.archetypeColor}22`,
                    }}
                  >
                    {confirming ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles size={16} style={{ color: selectedPath.archetypeColor }} />
                      </motion.div>
                    ) : (
                      <>
                        <span style={{ color: selectedPath.archetypeColor, fontSize: 18 }}>
                          {selectedPath.emoji}
                        </span>
                        {selectedPath.ctaText}
                      </>
                    )}
                  </motion.button>

                  <div className="mt-2 text-center text-[10px] text-white/20 italic">
                    {selectedPath.whisper}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer truth */}
            <div className="px-5 pb-4 pt-1 text-center">
              <div className="text-[9px] text-white/15 leading-relaxed">
                Neither path is wrong. The Earth keeps score in ways<br />no leaderboard can measure.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}