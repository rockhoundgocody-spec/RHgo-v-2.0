import React, { useEffect, useRef } from 'react';

/**
 * OrbParticles — soft amethyst motes drifting around the orb.
 * Organic sine-noise motion, gentle glow, amplitude-reactive when she speaks.
 * Pure canvas, no React re-renders.
 */
export default function OrbParticles({ size = 220, getAmplitude, count = 22 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = size * 1.7;
    canvas.width = w * dpr;
    canvas.height = w * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const parts = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
      radius: size * (0.52 + Math.random() * 0.32),
      speed: (0.05 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1),
      r: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.75 ? 195 : 280,
      base: 0.25 + Math.random() * 0.35,
    }));

    let raf;
    const tick = () => {
      const t = performance.now() * 0.001;
      const amp = getAmplitude ? getAmplitude() || 0 : 0;
      ctx.clearRect(0, 0, w, w);
      const cx = w / 2, cy = w / 2;
      for (const p of parts) {
        // Slow orbit + breathing radial drift — feels like dust in still air
        const a = p.angle + t * p.speed;
        const drift = Math.sin(t * 0.4 + p.phase) * size * 0.05
                    + Math.sin(t * 0.9 + p.phase * 2) * size * 0.02;
        const rad = p.radius + drift + amp * size * 0.12;
        const x = cx + Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad * 0.92;
        const twinkle = 0.5 + Math.sin(t * 1.3 + p.phase) * 0.5;
        const alpha = p.base * (0.4 + twinkle * 0.6) + amp * 0.35;
        const r = p.r * (1 + amp * 0.8);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        g.addColorStop(0, `hsla(${p.hue},100%,85%,${Math.min(alpha, 0.9)})`);
        g.addColorStop(0.4, `hsla(${p.hue},95%,70%,${Math.min(alpha * 0.5, 0.5)})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, getAmplitude, count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        width: size * 1.7,
        height: size * 1.7,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      }}
    />
  );
}