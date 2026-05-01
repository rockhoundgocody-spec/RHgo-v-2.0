import React, { useEffect, useRef } from 'react';
import BlackOpalShader from './BlackOpalShader.jsx';

/**
 * Tracks viewer perspective for stereoscopic 4D effect.
 * Refs update each frame with normalized (-1..1) x/y offsets driven by
 * cursor (desktop) or device orientation (mobile).
 * After Effects stereoscopic camera offset reference:
 * https://helpx.adobe.com/after-effects/kb/stereoscopic-3d-effects.html
 */
function usePerspective() {
  const xRef = useRef(0);
  const yRef = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);

  useEffect(() => {
    const handleMouse = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      targetX.current = (e.clientX / w) * 2 - 1;
      targetY.current = (e.clientY / h) * 2 - 1;
    };
    const handleOrient = (e) => {
      if (e.gamma == null || e.beta == null) return;
      targetX.current = Math.max(-1, Math.min(1, e.gamma / 30));
      targetY.current = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('deviceorientation', handleOrient, { passive: true });

    let raf;
    const tick = () => {
      xRef.current += (targetX.current - xRef.current) * 0.08;
      yRef.current += (targetY.current - yRef.current) * 0.08;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('deviceorientation', handleOrient);
      cancelAnimationFrame(raf);
    };
  }, []);

  return { xRef, yRef };
}

/**
 * Stacked depth-illusion layers on top of the main orb:
 *   1. ANAGLYPH — red & cyan channel-isolated copies offset on X axis
 *      (true red/cyan 3D, visible with anaglyph glasses)
 *   2. STEREO PARALLAX — two wider-spaced copies that drift slowly,
 *      creating perceived depth on any screen
 *   3. CHROMATIC ABERRATION — radial RGB rim split for lensed glass feel
 *
 * Each layer is low-opacity and additively blended so they read as
 * subtle depth rather than overpowering the orb.
 */
export default function StereoDepthLayers({ speaking, getAmplitude, getSpectrum }) {
  const redRef = useRef(null);
  const cyanRef = useRef(null);
  const parallaxLRef = useRef(null);
  const parallaxRRef = useRef(null);
  const chromRRef = useRef(null);
  const chromGRef = useRef(null);
  const chromBRef = useRef(null);

  // 4D viewer-perspective tracking — cursor/device-tilt driven
  const { xRef: persX, yRef: persY } = usePerspective();

  useEffect(() => {
    let raf;
    const tick = () => {
      const t = performance.now() * 0.001;
      const vx = persX.current; // -1..1
      const vy = persY.current;

      // Anaglyph offset shifts based on viewer angle (After Effects camera-offset style)
      const anaBase = 2.2 + Math.sin(t * 0.25) * 0.4;
      const anaOffset = anaBase + vx * 4.0;
      // Parallax planes counter-shift — near plane follows cursor, far plane resists
      const px = Math.sin(t * 0.18) * 3.0 + vx * 8.0;
      const py = Math.cos(t * 0.14) * 1.5 + vy * 6.0;
      // Chromatic aberration breathes + tilts with perspective
      const ca = 1.5 + Math.sin(t * 0.3) * 0.4 + Math.abs(vx) * 1.5;

      if (redRef.current) {
        redRef.current.style.transform = `translateX(${-anaOffset}px)`;
      }
      if (cyanRef.current) {
        cyanRef.current.style.transform = `translateX(${anaOffset}px)`;
      }
      if (parallaxLRef.current) {
        // near plane — moves WITH viewer
        parallaxLRef.current.style.transform = `translate(${-px}px, ${py}px) scale(1.008)`;
      }
      if (parallaxRRef.current) {
        // far plane — moves AGAINST viewer (parallax depth cue)
        parallaxRRef.current.style.transform = `translate(${px * 0.4}px, ${-py * 0.4}px) scale(0.992)`;
      }
      if (chromRRef.current) chromRRef.current.style.transform = `translate(${ca + vx * 1.5}px, ${vy * 0.8}px)`;
      if (chromGRef.current) chromGRef.current.style.transform = `translate(${vx * 0.6}px, ${ca * 0.4}px)`;
      if (chromBRef.current) chromBRef.current.style.transform = `translate(${-ca - vx * 1.5}px, ${-vy * 0.8}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [persX, persY]);

  const sharedShaderProps = {
    intensity: speaking ? 1.5 : 1.2,
    speed: speaking ? 0.5 : 0.3,
    getAmplitude,
    getSpectrum,
  };

  return (
    <>
      {/* 1. ANAGLYPH — red channel left, cyan channel right */}
      <div
        ref={redRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-25"
        style={{ willChange: 'transform', filter: 'url(#anaglyph-red)' }}
      >
        <BlackOpalShader {...sharedShaderProps} hueShift={1.8} />
      </div>
      <div
        ref={cyanRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-25"
        style={{ willChange: 'transform', filter: 'url(#anaglyph-cyan)' }}
      >
        <BlackOpalShader {...sharedShaderProps} hueShift={-1.8} />
      </div>

      {/* 2. STEREO PARALLAX — two slowly-drifting depth planes */}
      <div
        ref={parallaxLRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-20"
        style={{ willChange: 'transform' }}
      >
        <BlackOpalShader {...sharedShaderProps} hueShift={0.4} />
      </div>
      <div
        ref={parallaxRRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-20"
        style={{ willChange: 'transform' }}
      >
        <BlackOpalShader {...sharedShaderProps} hueShift={-0.4} />
      </div>

      {/* 3. CHROMATIC ABERRATION — radial RGB rim split (mask to outer ring only) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          maskImage:
            'radial-gradient(circle, transparent 60%, black 78%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(circle, transparent 60%, black 78%, transparent 100%)',
        }}
      >
        <div
          ref={chromRRef}
          className="absolute inset-0 mix-blend-screen opacity-35"
          style={{ willChange: 'transform', filter: 'url(#chrom-red)' }}
        >
          <BlackOpalShader {...sharedShaderProps} hueShift={2.0} />
        </div>
        <div
          ref={chromGRef}
          className="absolute inset-0 mix-blend-screen opacity-30"
          style={{ willChange: 'transform', filter: 'url(#chrom-green)' }}
        >
          <BlackOpalShader {...sharedShaderProps} hueShift={0} />
        </div>
        <div
          ref={chromBRef}
          className="absolute inset-0 mix-blend-screen opacity-35"
          style={{ willChange: 'transform', filter: 'url(#chrom-blue)' }}
        >
          <BlackOpalShader {...sharedShaderProps} hueShift={-2.0} />
        </div>
      </div>

      {/* SVG color matrix filters — isolate single channels for true anaglyph + chroma */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="anaglyph-red">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
            />
          </filter>
          <filter id="anaglyph-cyan">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
            />
          </filter>
          <filter id="chrom-red">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
            />
          </filter>
          <filter id="chrom-green">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
            />
          </filter>
          <filter id="chrom-blue">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>
    </>
  );
}