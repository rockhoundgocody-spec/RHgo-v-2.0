import React, { useEffect, useRef } from 'react';

/**
 * OrbParticles — soft amethyst & prismatic motes drifting around the orb.
 * High-performance canvas particle system:
 * - Pre-renders particle glow sprites once onto off-screen canvases (0 GC overhead in loop).
 * - IntersectionObserver pauses RAF when scrolled out of view.
 * - Dynamic amplitude and spectrum reactivity.
 */
export default function OrbParticles({ size = 220, getAmplitude, count = 24 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = size * 1.7;
    canvas.width = w * dpr;
    canvas.height = w * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Pre-render particle glow sprites to off-screen canvases to eliminate GC in RAF loop
    const spriteSize = 32;
    const createParticleSprite = (hue) => {
      const off = document.createElement('canvas');
      off.width = spriteSize * dpr;
      off.height = spriteSize * dpr;
      const offCtx = off.getContext('2d');
      offCtx.scale(dpr, dpr);
      const half = spriteSize / 2;
      const g = offCtx.createRadialGradient(half, half, 0, half, half, half);
      g.addColorStop(0, `hsla(${hue}, 100%, 88%, 1)`);
      g.addColorStop(0.35, `hsla(${hue}, 95%, 68%, 0.6)`);
      g.addColorStop(0.7, `hsla(${hue}, 90%, 55%, 0.18)`);
      g.addColorStop(1, 'transparent');
      offCtx.fillStyle = g;
      offCtx.beginPath();
      offCtx.arc(half, half, half, 0, Math.PI * 2);
      offCtx.fill();
      return off;
    };

    const sprites = {
      amethyst: createParticleSprite(280),
      cyan:     createParticleSprite(195),
      gold:     createParticleSprite(45),
      rose:     createParticleSprite(330),
    };

    const spriteKeys = ['amethyst', 'cyan', 'gold', 'rose'];

    const parts = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
      radius: size * (0.5 + Math.random() * 0.35),
      speed: (0.04 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1),
      scale: 0.5 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      sprite: sprites[spriteKeys[i % spriteKeys.length]],
      baseAlpha: 0.3 + Math.random() * 0.45,
    }));

    let raf;
    let isVisible = true;

    // Viewport intersection observer: stops RAF loop when off-screen
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);

    const cx = w / 2;
    const cy = w / 2;

    const tick = () => {
      if (!isVisible) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const t = performance.now() * 0.001;
      const amp = getAmplitude ? getAmplitude() || 0 : 0;
      ctx.clearRect(0, 0, w, w);

      for (const p of parts) {
        // Organic sinusoidal motion with audio-reactive radial swelling
        const a = p.angle + t * p.speed;
        const drift = Math.sin(t * 0.4 + p.phase) * size * 0.04
                    + Math.sin(t * 0.8 + p.phase * 2) * size * 0.02;
        const rad = p.radius + drift + amp * size * 0.14;
        const x = cx + Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad * 0.92;

        const twinkle = 0.5 + Math.sin(t * 1.5 + p.phase) * 0.5;
        const alpha = Math.min(0.95, p.baseAlpha * (0.4 + twinkle * 0.6) + amp * 0.4);
        const currentScale = p.scale * (1 + amp * 0.7);
        const drawDim = (spriteSize * currentScale) / 2;

        ctx.globalAlpha = alpha;
        ctx.drawImage(p.sprite, x - drawDim / 2, y - drawDim / 2, drawDim, drawDim);
      }
      ctx.globalAlpha = 1.0;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
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
