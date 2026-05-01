import React, { useEffect, useRef } from 'react';

/**
 * Animated environment-light reflections — simulates an HDRI/IBL probe
 * rotating around a glass sphere. Two soft elliptical "windows" of light
 * orbit the orb at different speeds and depths, mimicking the way a real
 * 3D sphere catches reflections from surrounding light sources.
 *
 * Inspired by Adobe After Effects animated environment lights:
 * https://helpx.adobe.com/after-effects/using/animated-environment-lights.html
 */
export default function EnvironmentLights() {
  const primaryRef = useRef(null);
  const secondaryRef = useRef(null);
  const fresnelRef = useRef(null);

  useEffect(() => {
    let raf;
    const tick = () => {
      const t = performance.now() * 0.0004;

      // Primary key light — large, slow orbit (warm magenta)
      const a1 = t * 0.7;
      const r1 = 22; // radius of orbit in %
      const x1 = 50 + Math.cos(a1) * r1;
      const y1 = 35 + Math.sin(a1 * 0.8) * 12;
      // Surface stretch — wider when near rim (grazing angle), tighter at center
      const dist1 = Math.hypot(x1 - 50, y1 - 50) / 50;
      const stretch1 = 1 + dist1 * 0.6;

      if (primaryRef.current) {
        primaryRef.current.style.background = `radial-gradient(ellipse ${28 * stretch1}% ${
          18 / stretch1
        }% at ${x1}% ${y1}%, hsla(295,100%,80%,0.35) 0%, hsla(280,100%,65%,0.18) 40%, transparent 75%)`;
      }

      // Secondary fill light — smaller, counter-rotating (cool cyan)
      const a2 = -t * 1.1 + 2.4;
      const r2 = 28;
      const x2 = 50 + Math.cos(a2) * r2;
      const y2 = 55 + Math.sin(a2 * 1.2) * 10;
      const dist2 = Math.hypot(x2 - 50, y2 - 50) / 50;
      const stretch2 = 1 + dist2 * 0.5;

      if (secondaryRef.current) {
        secondaryRef.current.style.background = `radial-gradient(ellipse ${20 * stretch2}% ${
          14 / stretch2
        }% at ${x2}% ${y2}%, hsla(195,100%,75%,0.28) 0%, hsla(210,100%,60%,0.12) 45%, transparent 75%)`;
      }

      // Fresnel rim — environment wrapping the silhouette (rotates slowly)
      const a3 = t * 0.5;
      const fx = 50 + Math.cos(a3) * 8;
      const fy = 50 + Math.sin(a3) * 8;
      if (fresnelRef.current) {
        fresnelRef.current.style.background = `radial-gradient(circle at ${fx}% ${fy}%, transparent 70%, hsla(280,100%,70%,0.25) 88%, hsla(195,100%,60%,0.15) 96%, transparent 100%)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Primary key light — magenta HDRI window orbiting the sphere */}
      <div
        ref={primaryRef}
        className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen blur-md"
        style={{ willChange: 'background' }}
      />

      {/* Secondary fill — cyan environment reflection */}
      <div
        ref={secondaryRef}
        className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen blur-md"
        style={{ willChange: 'background' }}
      />

      {/* Fresnel rim — environment wrapping the silhouette */}
      <div
        ref={fresnelRef}
        className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen"
        style={{ willChange: 'background' }}
      />
    </>
  );
}