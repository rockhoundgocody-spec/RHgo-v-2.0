import React, { useEffect, useRef } from 'react';
import BlackOpalShader from './BlackOpalShader.jsx';

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

  useEffect(() => {
    let raf;
    const tick = () => {
      const t = performance.now() * 0.001;
      // Anaglyph: small horizontal offset (~3px equivalent at 260px orb)
      const anaOffset = 2.2 + Math.sin(t * 0.7) * 0.6;
      // Parallax: slow oscillating drift to simulate viewer head motion
      const px = Math.sin(t * 0.35) * 4.5;
      const py = Math.cos(t * 0.28) * 2.2;
      // Chromatic aberration: radial split that breathes with time
      const ca = 1.5 + Math.sin(t * 0.9) * 0.5;

      if (redRef.current) {
        redRef.current.style.transform = `translateX(${-anaOffset}px)`;
      }
      if (cyanRef.current) {
        cyanRef.current.style.transform = `translateX(${anaOffset}px)`;
      }
      if (parallaxLRef.current) {
        parallaxLRef.current.style.transform = `translate(${-px}px, ${py}px) scale(1.005)`;
      }
      if (parallaxRRef.current) {
        parallaxRRef.current.style.transform = `translate(${px}px, ${-py}px) scale(0.995)`;
      }
      if (chromRRef.current) chromRRef.current.style.transform = `translate(${ca}px, 0)`;
      if (chromGRef.current) chromGRef.current.style.transform = `translate(0, ${ca * 0.4}px)`;
      if (chromBRef.current) chromBRef.current.style.transform = `translate(${-ca}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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