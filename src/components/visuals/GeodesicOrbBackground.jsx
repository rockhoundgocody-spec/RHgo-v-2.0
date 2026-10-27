import React, { useEffect, useRef } from 'react';

/**
 * GeodesicOrbBackground — levitating photon spheres behind the landing/login gate.
 *
 * Each orb reads as a glass sphere floating above the page rather than a flat
 * disc: a concave dark core, an inset shadow for depth, a light reflection on
 * the near surface, an under-lit rim, and a soft contact shadow beneath it.
 *
 * The field is alive, not ambient: the glass breathes and wanders, a fast
 * iridescent band sweeps each surface while a second band counter-swirls so the
 * light reads as liquid rather than a spinning disc, sparkles fire constantly
 * from three points on every sphere, and a blurred water-like aura swirls
 * behind the glass. Tilting the phone (or moving the pointer) parallaxes the
 * whole field.
 *
 * Pure CSS transforms + opacity — no canvas, no 3D libs.
 * With prefers-reduced-motion the field is calmed (motion slowed down, tilt
 * off) rather than frozen, so the spheres always read as alive.
 */

const ORBS = [
  { size: 260, top: '6%',  left: '-14%', delay: 0,   duration: 9,  drift: 34, hue: 280, tilt: 1,    sheen: 2.8, glint: 1.2 },
  { size: 150, top: '58%', left: '74%',  delay: 1.4, duration: 11, drift: 26, hue: 195, tilt: 0.7,  sheen: 3.3, glint: 1.5 },
  { size: 300, top: '30%', left: '48%',  delay: 2.6, duration: 13, drift: 42, hue: 330, tilt: 1.15, sheen: 2.4, glint: 1.0 },
  { size: 120, top: '78%', left: '10%',  delay: 3.4, duration: 8,  drift: 24, hue: 45,  tilt: 0.5,  sheen: 3.6, glint: 1.7 },
  { size: 190, top: '12%', left: '72%',  delay: 4.2, duration: 12, drift: 31, hue: 260, tilt: 0.9,  sheen: 3.0, glint: 1.3 },
];

// Three sparkle points per sphere, so glints fire almost continuously.
const GLINTS = [
  { left: '18%', top: '14%', w: 0.50, h: 0.30, rot: -28 },
  { left: '60%', top: '42%', w: 0.28, h: 0.18, rot: 22 },
  { left: '26%', top: '66%', w: 0.36, h: 0.20, rot: -12 },
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
  // Calmed for reduced-motion devices, never frozen.
  const pace = reduce ? 2.4 : 1;

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
        const g = orb.glint * pace;          // sparkle cycle
        const lag = orb.delay * pace;        // stagger between spheres
        const sheenSpeed = orb.sheen * pace; // one sweep across the surface
        const auraSpeed = orb.duration * 0.8 * pace;
        const pulse = orb.duration * 0.28 * pace;

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
                stays on the ground and answers every rise and fall */}
            <div
              className="absolute left-1/2 rounded-full"
              style={{
                bottom: `-${r * 0.24}px`,
                width: orb.size * 0.72,
                height: orb.size * 0.16,
                marginLeft: -(orb.size * 0.36),
                background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.22) 45%, transparent 72%)`,
                filter: 'blur(7px)',
                animation: `orb-shadow-${i} ${pulse}s ease-in-out infinite`,
                animationDelay: `${lag}s`,
              }}
            />

            {/* Drift — a living wander across the field */}
            <div
              className="absolute inset-0"
              style={{
                animation: `orb-drift-${i} ${orb.duration * 0.6 * pace}s ease-in-out infinite alternate`,
                animationDelay: `${lag}s`,
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
                    animation: `orb-breath-${i} ${pulse}s ease-in-out infinite`,
                    animationDelay: `${lag}s`,
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Water aura — blurred light swirling like liquid behind the glass */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: `-${r * 0.34}px`,
                      background: `
                        radial-gradient(circle at 34% 32%, hsla(${hue},100%,80%,0.5) 0%, transparent 46%),
                        radial-gradient(circle at 68% 70%, hsla(${(hue + 40) % 360},100%,78%,0.44) 0%, transparent 48%),
                        radial-gradient(circle at 54% 18%, hsla(${(hue + 300) % 360},100%,82%,0.36) 0%, transparent 44%)
                      `,
                      filter: 'blur(12px)',
                      mixBlendMode: 'screen',
                      animation: `orb-aura-${i} ${auraSpeed}s ease-in-out infinite`,
                      animationDelay: `${lag}s`,
                      willChange: 'transform, opacity',
                    }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: `-${r * 0.26}px`,
                      background: `radial-gradient(circle at 46% 62%, hsla(${(hue + 320) % 360},100%,84%,0.42) 0%, hsla(${hue},100%,72%,0.24) 40%, transparent 68%)`,
                      filter: 'blur(14px)',
                      mixBlendMode: 'screen',
                      animation: `orb-aura-${i} ${orb.duration * 1.15 * pace}s ease-in-out infinite reverse`,
                      animationDelay: `${lag + 0.6}s`,
                    }}
                  />

                  {/* Ambient halo behind the glass */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: `-${r * 0.22}px`,
                      background: `radial-gradient(circle at 50% 50%, hsla(${hue},95%,74%,0.38) 0%, hsla(${hue},90%,62%,0.2) 42%, transparent 70%)`,
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
                        `0 0 ${r * 0.55}px hsla(${hue},95%,68%,0.26)`,
                      ].join(', '),
                      border: `1px solid hsla(${hue},95%,80%,0.16)`,
                    }}
                  />

                  {/* Under-lit rim — light passing beneath the sphere */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(ellipse at 50% 88%, hsla(${hue},100%,88%,0.46) 0%, transparent 46%)`,
                      mixBlendMode: 'screen',
                    }}
                  />

                  {/* Iridescent sheen — a fast band of light sweeping the surface */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0deg, hsla(${hue},100%,90%,0.52) 30deg, transparent 64deg, hsla(${(hue + 45) % 360},100%,88%,0.44) 126deg, transparent 160deg, hsla(${(hue + 300) % 360},100%,88%,0.48) 244deg, transparent 282deg, hsla(${hue},100%,90%,0.4) 332deg, transparent 360deg)`,
                      mixBlendMode: 'screen',
                      opacity: 0.9,
                      animation: `orb-sheen-${i} ${sheenSpeed}s linear infinite`,
                      animationDelay: `${lag}s`,
                    }}
                  />

                  {/* Counter-swirl — a second band running the other way, so the
                      surface reads as liquid iridescence instead of a spinning disc */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 180deg, transparent 0deg, hsla(${(hue + 200) % 360},100%,88%,0.42) 44deg, transparent 96deg, hsla(${(hue + 80) % 360},100%,90%,0.36) 186deg, transparent 240deg, hsla(${hue},100%,86%,0.32) 318deg, transparent 360deg)`,
                      mixBlendMode: 'screen',
                      filter: 'blur(2px)',
                      opacity: 0.72,
                      animation: `orb-sheen-${i} ${sheenSpeed * 1.5}s linear infinite reverse`,
                      animationDelay: `${lag + 0.4}s`,
                    }}
                  />

                  {/* Sparkles — three points per sphere, firing one after another */}
                  {GLINTS.map((sp, k) => (
                    <div
                      key={k}
                      className="absolute"
                      style={{
                        left: sp.left,
                        top: sp.top,
                        width: r * sp.w,
                        height: r * sp.h,
                        transform: `rotate(${sp.rot}deg)`,
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.92) 0%, hsla(${hue},100%,95%,0.5) 40%, transparent 76%)`,
                          filter: 'blur(2.5px)',
                          animation: `orb-glint-${i} ${g}s ease-in-out infinite`,
                          animationDelay: `${lag + (k * g) / 3}s`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        ${ORBS.map((orb, i) => {
          const r = orb.size / 2;
          return `
          @keyframes orb-drift-${i} {
            0%   { transform: translate(-${orb.drift}px, ${orb.drift * 0.6}px); }
            100% { transform: translate(${orb.drift}px, -${orb.drift * 0.6}px); }
          }
          @keyframes orb-breath-${i} {
            0%, 100% { transform: scale(0.94) translateY(2%); opacity: 0.78; }
            50%      { transform: scale(1.08) translateY(-2%); opacity: 1; }
          }
          @keyframes orb-shadow-${i} {
            0%, 100% { transform: scale(0.88); opacity: 0.4; }
            50%      { transform: scale(1.1); opacity: 0.85; }
          }
          @keyframes orb-sheen-${i} {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes orb-glint-${i} {
            0%, 100% { opacity: 0.12; transform: scale(0.7); }
            50%      { opacity: 1; transform: scale(1.15); }
          }
          @keyframes orb-aura-${i} {
            0%   { transform: translate(-${(r * 0.07).toFixed(1)}px, ${(r * 0.06).toFixed(1)}px) scale(0.94) rotate(0deg);   opacity: 0.72; }
            33%  { transform: translate(${(r * 0.08).toFixed(1)}px, -${(r * 0.05).toFixed(1)}px) scale(1.08) rotate(120deg); opacity: 1; }
            66%  { transform: translate(-${(r * 0.04).toFixed(1)}px, -${(r * 0.09).toFixed(1)}px) scale(1.02) rotate(240deg); opacity: 0.84; }
            100% { transform: translate(-${(r * 0.07).toFixed(1)}px, ${(r * 0.06).toFixed(1)}px) scale(0.94) rotate(360deg);   opacity: 0.72; }
          }
        `;
        }).join('')}
      `}</style>
    </div>
  );
}