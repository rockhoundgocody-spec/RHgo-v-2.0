import React, { useEffect, useRef } from 'react';
import BlackOpalShader from './BlackOpalShader.jsx';

/**
 * Mimics z-fighting: two extra copies of the opal shader stacked at the same
 * "depth" with tiny sub-pixel offsets, slight scale jitter, and shifted hues.
 * They flicker/blend against the main layer like coplanar 3D planes do.
 */
export default function ZFightLayers({ speaking, getAmplitude, getSpectrum }) {
  const aRef = useRef(null);
  const bRef = useRef(null);

  useEffect(() => {
    let raf;
    const tick = () => {
      const t = performance.now() * 0.001;
      // Slow, smooth drift — no more high-freq flicker
      const jx1 = Math.sin(t * 1.4) * 0.4 + Math.sin(t * 0.7) * 0.2;
      const jy1 = Math.cos(t * 1.2) * 0.4 + Math.sin(t * 0.5) * 0.2;
      const jx2 = Math.sin(t * 1.7 + 1.7) * 0.35 + Math.cos(t * 0.9) * 0.18;
      const jy2 = Math.cos(t * 1.5 + 0.9) * 0.35 + Math.sin(t * 0.6) * 0.18;
      const s1 = 1 + Math.sin(t * 0.8) * 0.0018;
      const s2 = 1 + Math.cos(t * 0.9) * 0.0018;
      // Gentle, slow opacity breathing — eliminates strobing
      const f1 = 0.32 + 0.08 * Math.sin(t * 1.1);
      const f2 = 0.32 + 0.08 * Math.cos(t * 1.3 + 1.2);
      if (aRef.current) {
        aRef.current.style.transform = `translate(${jx1}px, ${jy1}px) scale(${s1})`;
        aRef.current.style.opacity = String(f1);
      }
      if (bRef.current) {
        bRef.current.style.transform = `translate(${jx2}px, ${jy2}px) scale(${s2})`;
        bRef.current.style.opacity = String(f2);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Coplanar copy A — hue shifted toward magenta, additive blend */}
      <div
        ref={aRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{ willChange: 'transform, opacity' }}
      >
        <BlackOpalShader
          intensity={speaking ? 1.6 : 1.25}
          speed={speaking ? 0.58 : 0.34}
          hueShift={speaking ? 2.4 : 0.9}
          getAmplitude={getAmplitude}
          getSpectrum={getSpectrum}
        />
      </div>
      {/* Coplanar copy B — hue shifted toward cyan, difference blend for chromatic split */}
      <div
        ref={bRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{ willChange: 'transform, opacity' }}
      >
        <BlackOpalShader
          intensity={speaking ? 1.6 : 1.25}
          speed={speaking ? 0.5 : 0.3}
          hueShift={speaking ? 0.8 : -0.9}
          getAmplitude={getAmplitude}
          getSpectrum={getSpectrum}
        />
      </div>
    </>
  );
}