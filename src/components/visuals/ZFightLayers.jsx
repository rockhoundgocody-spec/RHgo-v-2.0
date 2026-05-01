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
      // Tiny sub-pixel jitter — classic z-fight flicker
      const jx1 = Math.sin(t * 23.0) * 0.6 + Math.sin(t * 7.3) * 0.3;
      const jy1 = Math.cos(t * 19.0) * 0.6 + Math.sin(t * 5.1) * 0.3;
      const jx2 = Math.sin(t * 31.0 + 1.7) * 0.5 + Math.cos(t * 9.4) * 0.25;
      const jy2 = Math.cos(t * 27.0 + 0.9) * 0.5 + Math.sin(t * 6.8) * 0.25;
      const s1 = 1 + Math.sin(t * 11.0) * 0.0025;
      const s2 = 1 + Math.cos(t * 13.0) * 0.0025;
      // Flicker opacity in/out of dominance — the core of z-fighting look
      const f1 = 0.35 + 0.25 * Math.sin(t * 17.0);
      const f2 = 0.35 + 0.25 * Math.cos(t * 21.0 + 1.2);
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