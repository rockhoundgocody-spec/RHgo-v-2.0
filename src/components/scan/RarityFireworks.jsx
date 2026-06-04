import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Rarity configs ────────────────────────────────────────────────────────────
const CONFIGS = {
  legendary: {
    particles: 120,
    bursts: 6,
    colors: ['#a78bfa', '#c4b5fd', '#f0abfc', '#fde68a', '#ffffff', '#e879f9', '#7c3aed'],
    trailLength: 6,
    shapes: ['circle', 'star', 'diamond'],
    gravity: 0.12,
    speed: [4, 10],
    decay: [0.008, 0.016],
    sizeRange: [3, 7],
    ringBursts: true,
    announcement: { emoji: '👑', label: 'LEGENDARY', sublabel: 'An extraordinary find!', color: '#a78bfa', glow: 'hsla(280,100%,70%,0.8)' },
  },
  rare: {
    particles: 70,
    bursts: 3,
    colors: ['#38bdf8', '#7dd3fc', '#0ea5e9', '#bae6fd', '#ffffff'],
    trailLength: 3,
    shapes: ['circle', 'diamond'],
    gravity: 0.13,
    speed: [3, 7],
    decay: [0.012, 0.020],
    sizeRange: [2, 5],
    ringBursts: false,
    announcement: { emoji: '💎', label: 'RARE FIND', sublabel: 'Only a few rockhounds ever discover this.', color: '#38bdf8', glow: 'hsla(195,100%,60%,0.7)' },
  },
  uncommon: {
    particles: 35,
    bursts: 2,
    colors: ['#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
    trailLength: 2,
    shapes: ['circle'],
    gravity: 0.15,
    speed: [2, 5],
    decay: [0.018, 0.028],
    sizeRange: [2, 4],
    ringBursts: false,
    announcement: null, // silent for uncommon — only visual
  },
};

// ─── Derive rarity from result object ──────────────────────────────────────────
function resolveRarity(result) {
  if (!result) return null;
  // Prefer explicit rarity field set during save
  if (result.rarity && result.rarity !== 'common') return result.rarity;
  // Fallback: infer from confidence
  const conf = result.confidence || 0;
  if (conf >= 0.85) return 'legendary';
  if (conf >= 0.70) return 'rare';
  if (conf >= 0.50) return 'uncommon';
  return null; // common → no fireworks
}

// ─── Draw helpers ──────────────────────────────────────────────────────────────
function drawShape(ctx, shape, x, y, size) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x, y, size, 0, Math.PI * 2);
  } else if (shape === 'diamond') {
    ctx.moveTo(x, y - size * 1.5);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size * 1.5);
    ctx.lineTo(x - size, y);
    ctx.closePath();
  } else if (shape === 'star') {
    for (let i = 0; i < 5; i++) {
      const outerAngle = ((Math.PI * 2) / 5) * i - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      if (i === 0) ctx.moveTo(x + Math.cos(outerAngle) * size * 1.6, y + Math.sin(outerAngle) * size * 1.6);
      else ctx.lineTo(x + Math.cos(outerAngle) * size * 1.6, y + Math.sin(outerAngle) * size * 1.6);
      ctx.lineTo(x + Math.cos(innerAngle) * size * 0.7, y + Math.sin(innerAngle) * size * 0.7);
    }
    ctx.closePath();
  }
  ctx.fill();
}

// ─── Spawn particle set ─────────────────────────────────────────────────────────
function spawnParticles(cfg, canvasW, canvasH) {
  const particles = [];
  for (let b = 0; b < cfg.bursts; b++) {
    // Crown-arc burst origins for legendary, scattered for others
    const bx = canvasW * (cfg.bursts > 4
      ? 0.15 + (b / (cfg.bursts - 1)) * 0.70
      : 0.2 + Math.random() * 0.6);
    const by = canvasH * (0.08 + Math.random() * 0.38);
    const perBurst = Math.floor(cfg.particles / cfg.bursts);

    // Optional expanding ring
    if (cfg.ringBursts) {
      for (let r = 0; r < 20; r++) {
        const angle = (Math.PI * 2 * r) / 20;
        particles.push({
          x: bx, y: by,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          color: '#ffffff',
          alpha: 0.6,
          size: 1.5,
          decay: 0.025,
          gravity: 0,
          trail: [],
          shape: 'circle',
          isRing: true,
        });
      }
    }

    for (let i = 0; i < perBurst; i++) {
      const angle = (Math.PI * 2 * i) / perBurst + (Math.random() - 0.5) * 0.5;
      const [sMin, sMax] = cfg.speed;
      const speed = sMin + Math.random() * (sMax - sMin);
      const [szMin, szMax] = cfg.sizeRange;
      const [dMin, dMax] = cfg.decay;
      particles.push({
        x: bx, y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (2 + Math.random() * 2),
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        alpha: 1,
        size: szMin + Math.random() * (szMax - szMin),
        decay: dMin + Math.random() * (dMax - dMin),
        gravity: cfg.gravity,
        trail: [],
        trailMax: cfg.trailLength,
        shape: cfg.shapes[Math.floor(Math.random() * cfg.shapes.length)],
        isRing: false,
      });
    }
  }
  return particles;
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function RarityFireworks({ result, trigger }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    if (!trigger || !result) return;
    const rarity = resolveRarity(result);
    if (!rarity) return;

    const cfg = CONFIGS[rarity];
    if (!cfg) return;

    // Show announcement overlay for rare+
    if (cfg.announcement) {
      setAnnouncement(cfg.announcement);
      setTimeout(() => setAnnouncement(null), 3200);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let particles = spawnParticles(cfg, canvas.width, canvas.height);

    // For legendary: second wave after 600ms
    let secondWaveTimeout;
    if (rarity === 'legendary') {
      secondWaveTimeout = setTimeout(() => {
        particles = particles.concat(spawnParticles(cfg, canvas.width, canvas.height));
      }, 600);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;

        // Trail
        if (!p.isRing && p.trailMax > 0) {
          p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
          if (p.trail.length > p.trailMax) p.trail.shift();
          for (let t = 0; t < p.trail.length; t++) {
            const tp = p.trail[t];
            const tAlpha = (t / p.trail.length) * tp.alpha * 0.4;
            ctx.save();
            ctx.globalAlpha = Math.max(tAlpha, 0);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Physics
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        // Draw
        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.isRing ? 4 : 10;
        drawShape(ctx, p.shape, p.x, p.y, p.size);
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(secondWaveTimeout);
    };
  }, [trigger, result]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        style={{ mixBlendMode: 'screen' }}
      />

      <AnimatePresence>
        {announcement && (
          <motion.div
            key="rarity-announcement"
            initial={{ opacity: 0, scale: 0.6, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center"
            style={{ top: '22%' }}
          >
            {/* Glow ring */}
            <div
              className="absolute w-48 h-48 rounded-full -z-10"
              style={{
                background: `radial-gradient(circle, ${announcement.glow} 0%, transparent 70%)`,
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
              }}
            />

            <motion.div
              animate={{ rotate: [0, -4, 4, -2, 2, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-6xl mb-2 drop-shadow-2xl"
            >
              {announcement.emoji}
            </motion.div>

            <motion.div
              initial={{ letterSpacing: '0.05em' }}
              animate={{ letterSpacing: '0.35em' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl font-black uppercase"
              style={{
                color: announcement.color,
                textShadow: `0 0 30px ${announcement.glow}, 0 0 60px ${announcement.glow}`,
              }}
            >
              {announcement.label}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-1 text-white/70 text-sm font-medium tracking-wide text-center px-8"
            >
              {announcement.sublabel}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}