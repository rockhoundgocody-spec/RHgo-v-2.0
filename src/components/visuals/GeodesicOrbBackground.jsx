import React, { useEffect, useRef } from 'react';

/**
 * GeodesicOrbBackground — slowly drifting photon-sphere rings
 * (luminous annulus, dark center — light orbiting a black hole)
 * behind the landing/login experience.
 *
 * Pure CSS transforms + opacity. No canvas, no 3D libs. 60fps.
 * Subtle pointer-movement parallax via CSS custom properties.
 * Respects prefers-reduced-motion (static glow, no drift, no parallax).
 */

const ORBS = [
  { size: 180, top: '8%',  left: '-6%',  delay: 0,  duration: 28, drift: 18, hue: 280 },
  { size: 120, top: '62%', left: '78%',  delay: 4,  duration: 34, drift: 14, hue: 195 },
  { size: 220, top: '35%', left: '55%',  delay: 8,  duration: 40, drift: 22, hue: 330 },
  { size: 90,  top: '80%', left: '15%',  delay: 12, duration: 26, drift: 12, hue: 45  },
  { size: 140, top: '15%', left: '82%',  delay: 6,  duration: 32, drift: 16, hue: 260 },
];

export default function GeodesicOrbBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // no parallax for reduced-motion users

    const el = containerRef.current;
    if (!el) return;

    let raf = null;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--parallax-x', `${x * 12}px`);
        el.style.setProperty('--parallax-y', `${y * 12}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ '--parallax-x': '0px', '--parallax-y': '0px', zIndex: 0 }}
    >
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            background: `radial-gradient(circle, transparent 36%, hsla(${orb.hue},95%,78%,0.55) 41%, hsla(${orb.hue},90%,60%,0.28) 47%, transparent 58%)`,
            filter: 'blur(6px)',
            transform: `translate(var(--parallax-x), var(--parallax-y))`,
            transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)',
            animation: reduce ? 'none' : `geodesic-drift-${i} ${orb.duration}s ease-in-out infinite alternate`,
            animationDelay: `${orb.delay}s`,
          }}
        >
          {/* Photon ring facet shimmer — conic highlights orbiting the annulus */}
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, hsla(${orb.hue},100%,85%,0.22) 30deg, transparent 60deg, hsla(${orb.hue},100%,85%,0.22) 120deg, transparent 150deg, hsla(${orb.hue},100%,85%,0.22) 240deg, transparent 270deg, hsla(${orb.hue},100%,85%,0.22) 330deg, transparent 360deg)`,
              mixBlendMode: 'screen',
            }}
          />
        </div>
      ))}
      <style>{`
        ${ORBS.map((orb, i) => `
          @keyframes geodesic-drift-${i} {
            0%   { transform: translate(calc(var(--parallax-x) - ${orb.drift}px), calc(var(--parallax-y) + ${orb.drift * 0.6}px)) rotate(0deg); }
            100% { transform: translate(calc(var(--parallax-x) + ${orb.drift}px), calc(var(--parallax-y) - ${orb.drift * 0.6}px)) rotate(8deg); }
          }
        `).join('')}
      `}</style>
    </div>
  );
}