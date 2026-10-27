import React, { useEffect, useRef } from 'react';

/**
 * GeodesicOrbBackground — levitating photon spheres behind the landing/login gate.
 *
 * Each orb reads as a glass sphere floating above the page rather than a flat
 * disc: a concave dark core, an inset shadow for depth, a light reflection on
 * the near surface, an under-lit rim, and a soft contact shadow beneath it.
 * A slow breath keeps them alive, and tilting the phone (or moving the pointer)
 * parallaxes and tilts the whole field, so the spheres sit inside the screen.
 *
 * Pure CSS transforms + opacity — no canvas, no 3D libs.
 * Respects prefers-reduced-motion (static sphere, no breath, no drift, no tilt).
 */

const ORBS = [
  { size: 260, top: '6%',  left: '-14%', delay: 0,   duration: 9,  drift: 16, hue: 280, tilt: 1 },
  { size: 150, top: '58%', left: '74%',  delay: 1.4, duration: 11, drift: 12, hue: 195, tilt: 0.7 },
  { size: 300, top: '30%', left: '48%',  delay: 2.6, duration: 13, drift: 20, hue: 330, tilt: 1.15 },
  { size: 120, top: '78%', left: '10%',  delay: 3.4, duration: 8,  drift: 10, hue: 45,  tilt: 0.5 },
  { size: 190, top: '12%', left: '72%',  delay: 4.2, duration: 12, drift: 14, hue: 260, tilt: 0.9 },
];

const MAX_TILT_X = 7;   // deg of 3D lean at full side tilt
const MAX_TILT_Y = 5;
const MAX_SHIFT = 16;   // px of parallax at full tilt

export default function GeodesicOrbBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const el = containerRef.current;
    if (!el) return;

    let raf = null;
    // nx / ny are -1 … 1 across the screen: side tilt and front tilt.
    const apply = (nx, ny) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        el.style.setProperty('--parallax-x', `${(nx * MAX_SHIFT).toFixed(2)}px`);
        el.style.setProperty('--parallax-y', `${(ny * MAX_SHIFT * 0.7).toFixed(2)}px`);
        el.style.setProperty('--tilt-x', `${(-ny * MAX_TILT_X).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(nx * MAX_TILT_Y).toFixed(2)}deg`);
      });
    };

    // Pointer / mouse fallback (desktop, and phones before a tilt fix)
    const onMove = (e) => {
      if (!window.innerWidth || !window.innerHeight) return;
      apply((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
    };

    // Device tilt — the phone leaning left/right drives the spheres
    const onOrient = (e) => {
      if (e.gamma == null && e.beta == null) return;
      const nx = Math.max(-1, Math.min(1, (e.gamma || 0) / 32));
      const ny = Math.max(-1, Math.min(1, ((e.beta || 0) - 40) / 32));
      apply(nx, ny);
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    const DOE = window.DeviceOrientationEvent;
    let wantsGesture = false;
    if (DOE && typeof DOE.requestPermission === 'function') {
      // iOS needs an explicit grant, which must come from a user gesture.
      wantsGesture = true;
    } else if (DOE) {
      window.addEventListener('deviceorientation', onOrient, true);
    }

    const askForTilt = async () => {
      try {
        const granted = (await DOE.requestPermission()) === 'granted';
        if (granted) window.addEventListener('deviceorientation', onOrient, true);
      } catch { /* user declined — pointer parallax still applies */ }
    };
    if (wantsGesture) window.addEventListener('pointerdown', askForTilt, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('deviceorientation', onOrient, true);
      if (wantsGesture) window.removeEventListener('pointerdown', askForTilt);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const reduce = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        '--parallax-x': '0px',
        '--parallax-y': '0px',
        '--tilt-x': '0deg',
        '--tilt-y': '0deg',
        perspective: '900px',
        zIndex: 0,
      }}
    >
      {ORBS.map((orb, i) => {
        const r = orb.size / 2;
        const hue = orb.hue;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              width: orb.size,
              height: orb.size,
              top: orb.top,
              left: orb.left,
              transform: 'translate3d(var(--parallax-x), var(--parallax-y), 0)',
              transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Contact shadow — the sphere floats above the page, so the shadow
                stays on the ground and breathes with it */}
            <div
              className="absolute left-1/2 rounded-full"
              style={{
                bottom: `-${r * 0.24}px`,
                width: orb.size * 0.72,
                height: orb.size * 0.16,
                marginLeft: -(orb.size * 0.36),
                background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.22) 45%, transparent 72%)`,
                filter: 'blur(7px)',
                animation: reduce ? 'none' : `orb-shadow-${i} ${orb.duration}s ease-in-out infinite`,
                animationDelay: `${orb.delay}s`,
              }}
            />

            {/* Drift — slow wander across the field */}
            <div
              className="absolute inset-0"
              style={{
                animation: reduce ? 'none' : `orb-drift-${i} ${orb.duration * 2.6}s ease-in-out infinite alternate`,
                animationDelay: `${orb.delay}s`,
              }}
            >
              {/* Tilt — the 3D lean that follows the phone */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `rotateX(calc(var(--tilt-x) * ${orb.tilt})) rotateY(calc(var(--tilt-y) * ${orb.tilt}))`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Breath — the whole sphere swells and settles */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    animation: reduce ? 'none' : `orb-breath-${i} ${orb.duration}s ease-in-out infinite`,
                    animationDelay: `${orb.delay}s`,
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Ambient halo behind the glass */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: `-${r * 0.22}px`,
                      background: `radial-gradient(circle at 50% 50%, hsla(${hue},95%,72%,0.30) 0%, hsla(${hue},90%,60%,0.16) 42%, transparent 70%)`,
                      filter: 'blur(12px)',
                    }}
                  />

                  {/* Glass body: concave dark core + inset depth */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `
                        radial-gradient(circle at 46% 46%, rgba(6,7,16,0.78) 0%, rgba(8,9,20,0.5) 34%, hsla(${hue},85%,55%,0.20) 58%, transparent 76%),
                        radial-gradient(circle at 34% 28%, hsla(${hue},100%,90%,0.55) 0%, hsla(${hue},95%,70%,0.28) 26%, hsla(${hue},85%,48%,0.14) 48%, transparent 72%)
                      `,
                      boxShadow: [
                        `inset ${r * 0.10}px ${r * 0.12}px ${r * 0.26}px hsla(${hue},95%,86%,0.22)`,
                        `inset -${r * 0.16}px -${r * 0.18}px ${r * 0.34}px rgba(3,4,12,0.78)`,
                        `inset 0 0 ${r * 0.20}px hsla(${hue},90%,70%,0.18)`,
                        `0 0 ${r * 0.55}px hsla(${hue},95%,68%,0.22)`,
                      ].join(', '),
                      border: `1px solid hsla(${hue},95%,80%,0.14)`,
                    }}
                  />

                  {/* Under-lit rim — light passing beneath the sphere */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(ellipse at 50% 88%, hsla(${hue},100%,88%,0.42) 0%, transparent 46%)`,
                      mixBlendMode: 'screen',
                    }}
                  />

                  {/* Iridescent sheen orbiting the glass */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0deg, hsla(${hue},100%,88%,0.42) 34deg, transparent 68deg, hsla(${(hue + 45) % 360},100%,86%,0.34) 132deg, transparent 168deg, hsla(${(hue + 300) % 360},100%,86%,0.38) 248deg, transparent 286deg, hsla(${hue},100%,88%,0.30) 336deg, transparent 360deg)`,
                      mixBlendMode: 'screen',
                      opacity: 0.75,
                      animation: reduce ? 'none' : `orb-sheen-${i} ${orb.duration * 2.2}s linear infinite`,
                    }}
                  />

                  {/* Specular reflection — the light source sitting on the glass */}
                  <div
                    className="absolute"
                    style={{
                      left: '22%',
                      top: '16%',
                      width: r * 0.46,
                      height: r * 0.28,
                      borderRadius: '9999px',
                      background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.85) 0%, hsla(${hue},100%,95%,0.45) 38%, transparent 74%)`,
                      filter: 'blur(2.5px)',
                      transform: 'rotate(-28deg)',
                      animation: reduce ? 'none' : `orb-glint-${i} ${orb.duration * 0.75}s ease-in-out infinite`,
                      animationDelay: `${orb.delay}s`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        ${ORBS.map((orb, i) => `
          @keyframes orb-drift-${i} {
            0%   { transform: translate(-${orb.drift}px, ${orb.drift * 0.6}px); }
            100% { transform: translate(${orb.drift}px, -${orb.drift * 0.6}px); }
          }
          @keyframes orb-breath-${i} {
            0%, 100% { transform: scale(0.962); opacity: 0.86; }
            50%      { transform: scale(1.038); opacity: 1; }
          }
          @keyframes orb-shadow-${i} {
            0%, 100% { transform: scale(0.92); opacity: 0.5; }
            50%      { transform: scale(1.06); opacity: 0.8; }
          }
          @keyframes orb-sheen-${i} {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes orb-glint-${i} {
            0%, 100% { opacity: 0.55; }
            50%      { opacity: 1; }
          }
        `).join('')}
      `}</style>
    </div>
  );
}