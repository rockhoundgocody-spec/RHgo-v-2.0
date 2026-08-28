/**
 * LiquidOrbGlow — shimmering liquid orb halo that wraps a Geo-Badge during the
 * earn moment. Iridescent flowing gradient core + shimmer sweep, all CSS-driven
 * (GPU-friendly) and disabled under prefers-reduced-motion.
 */
import React from 'react';

export default function LiquidOrbGlow({ size = 200, color = 'hsla(280,100%,70%,0.9)', reduceMotion = false }) {
  return (
    <div
      className="absolute pointer-events-none flex items-center justify-center"
      style={{ inset: 0, zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Outer iridescent liquid orb — slow rotating conic gradient, blurred */}
      <div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${color}, hsla(195,100%,60%,0.65), hsla(48,100%,62%,0.65), hsla(320,100%,65%,0.65), ${color})`,
          filter: 'blur(30px)',
          opacity: 0.6,
          mixBlendMode: 'screen',
          animation: reduceMotion ? 'none' : 'log-spin 9s linear infinite',
        }}
      />

      {/* Inner liquid core — radial pulse */}
      <div
        style={{
          position: 'absolute',
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: '50%',
          background: `radial-gradient(circle at 42% 36%, hsla(0,0%,100%,0.55) 0%, ${color} 32%, transparent 72%)`,
          filter: 'blur(16px)',
          animation: reduceMotion ? 'none' : 'log-pulse 3.2s ease-in-out infinite',
        }}
      />

      {/* Shimmer sweep — diagonal light passing through the liquid orb */}
      {!reduceMotion && (
        <div
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(115deg, transparent 38%, hsla(0,0%,100%,0.38) 50%, transparent 62%)',
            mixBlendMode: 'overlay',
            animation: 'log-shimmer 2.6s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}