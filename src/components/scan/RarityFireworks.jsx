import React, { useEffect, useRef } from 'react';

// Rarity configs
const RARITY_FIREWORKS = {
  legendary: { particles: 80, colors: ['#a78bfa', '#c4b5fd', '#7c3aed', '#f0abfc', '#fde68a'], bursts: 5 },
  rare:       { particles: 50, colors: ['#38bdf8', '#7dd3fc', '#0ea5e9', '#e0f2fe'],            bursts: 3 },
  uncommon:   { particles: 30, colors: ['#34d399', '#6ee7b7', '#059669'],                        bursts: 2 },
  common:     { particles: 0,  colors: [],                                                        bursts: 0 },
};

function getRarity(result) {
  if (!result) return 'common';
  const conf = result.confidence || 0;
  if (conf >= 0.85) return 'legendary';
  if (conf >= 0.70) return 'rare';
  if (conf >= 0.50) return 'uncommon';
  return 'common';
}

export default function RarityFireworks({ result, trigger }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!trigger || !result) return;
    const rarity = getRarity(result);
    const cfg = RARITY_FIREWORKS[rarity];
    if (!cfg.particles) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    for (let b = 0; b < cfg.bursts; b++) {
      const bx = canvas.width * (0.2 + Math.random() * 0.6);
      const by = canvas.height * (0.1 + Math.random() * 0.5);
      const perBurst = Math.floor(cfg.particles / cfg.bursts);
      for (let i = 0; i < perBurst; i++) {
        const angle = (Math.PI * 2 * i) / perBurst + Math.random() * 0.3;
        const speed = 3 + Math.random() * 6;
        particles.push({
          x: bx, y: by,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
          alpha: 1,
          size: 3 + Math.random() * 4,
          decay: 0.012 + Math.random() * 0.018,
          gravity: 0.15,
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [trigger, result]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}