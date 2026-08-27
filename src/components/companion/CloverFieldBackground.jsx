/**
 * CloverFieldBackground — an animated 3D cloverfield that recedes concavely
 * into the woods toward the top-right (the vanishing point / focal depth).
 * Win95-screensaver-style wildlife wanders across at depth-appropriate bands.
 * Pure CSS/DOM (no WebGL) so it stays light on mobile. pointer-events:none.
 */
import React, { useMemo } from 'react';

const KEYFRAMES = `
@keyframes rhgo-cf-sway { 0%,100%{transform:scale(1) rotate(-2.5deg)} 50%{transform:scale(1.06) rotate(2.5deg)} }
@keyframes rhgo-cf-walk { 0%{transform:translateX(-18vw)} 100%{transform:translateX(120vw)} }
@keyframes rhgo-cf-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes rhgo-cf-firefly { 0%{transform:translate(0,0);opacity:0} 15%{opacity:.85} 50%{transform:translate(24px,-34px);opacity:.6} 85%{opacity:.4} 100%{transform:translate(-12px,-70px);opacity:0} }
@keyframes rhgo-cf-shimmer { 0%,100%{opacity:.35} 50%{opacity:.7} }
@keyframes rhgo-cf-drift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-6px,8px)} }
`;

// Tiny seeded RNG so the field layout is stable across renders.
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CLOVER_EMOJIS = ['🍀', '🍀', '🍀', '🍀', '🌿', '🌼'];

const ANIMALS = [
  { e: '🦌', top: '60%', dur: 28, delay: 0, rtl: false, scale: 0.95 },
  { e: '🐰', top: '70%', dur: 13, delay: 5, rtl: true, scale: 0.7 },
  { e: '🦊', top: '56%', dur: 24, delay: 14, rtl: false, scale: 0.85 },
  { e: '🐿️', top: '75%', dur: 11, delay: 3, rtl: true, scale: 0.6 },
  { e: '🦃', top: '64%', dur: 34, delay: 20, rtl: false, scale: 0.9 },
  { e: '🦅', top: '18%', dur: 20, delay: 9, rtl: true, scale: 0.75, fly: true },
  { e: '🐢', top: '80%', dur: 44, delay: 16, rtl: false, scale: 0.55 },
];

export default function CloverFieldBackground() {
  const clovers = useMemo(() => {
    const rng = makeRng(20260827);
    const list = [];
    const cols = 7;
    const rows = 9;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() < 0.12) continue; // sparse gaps
        const jitterX = (rng() - 0.5) * 9;
        const jitterY = (rng() - 0.5) * 7;
        const col = (c + 0.5) / cols + jitterX / 100; // 0..1 left→right
        const row = (r + 0.5) / rows + jitterY / 100; // 0..1 top(far)→bottom(near)
        // depth: top-right is farthest. row near 1 = close, col near 1 = far right.
        const depth = row * 0.62 + (1 - col) * 0.0 + (1 - row) * 0; // row drives depth
        // We want bottom (row→1) near & big; top (row→0) far & small.
        const near = row; // 0 far .. 1 near
        const scale = 0.28 + near * 0.95;
        const opacity = 0.32 + near * 0.6;
        const blur = (1 - near) * 1.6;
        const emoji = CLOVER_EMOJIS[Math.floor(rng() * CLOVER_EMOJIS.length)];
        list.push({
          id: `${r}-${c}`,
          left: `${col * 100}%`,
          top: `${(1 - row) * 100}%`, // local top: far row → top of plane
          scale,
          opacity,
          blur,
          emoji,
          delay: rng() * 6,
          dur: 3.4 + rng() * 2.6,
        });
      }
    }
    return list;
  }, []);

  const fireflies = useMemo(() => {
    const rng = makeRng(7712);
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      left: `${10 + rng() * 80}%`,
      top: `${35 + rng() * 45}%`,
      delay: rng() * 8,
      dur: 6 + rng() * 5,
      size: 3 + rng() * 3,
    }));
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <style>{KEYFRAMES}</style>

      {/* Sky + woods receding to top-right (warm sun glow at the vanishing point) */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(120% 90% at 82% 6%, hsla(45,90%,72%,0.42) 0%, hsla(40,70%,55%,0.16) 22%, hsla(0,0%,0%,0) 48%),
          linear-gradient(160deg, hsl(150,42%,16%) 0%, hsl(145,46%,20%) 30%, hsl(140,52%,26%) 55%, hsl(135,58%,30%) 100%)
        `,
      }} />

      {/* Dappled sun-ray shimmer through the canopy (top-right) */}
      <div className="absolute" style={{
        top: '-10%', right: '-8%', width: '70%', height: '60%',
        background: 'radial-gradient(closest-side, hsla(48,95%,80%,0.30), transparent 70%)',
        animation: 'rhgo-cf-shimmer 9s ease-in-out infinite',
        filter: 'blur(8px)',
      }} />

      {/* Concave cloverfield plane — tilted so it recedes INTO the screen toward top-right */}
      <div className="absolute inset-0" style={{ perspective: '1100px', perspectiveOrigin: '12% 92%' }}>
        <div className="absolute" style={{
          left: 0, bottom: 0, width: '100%', height: '132%',
          transform: 'rotateX(60deg) rotateZ(-22deg)',
          transformOrigin: '0% 100%',
          transformStyle: 'preserve-3d',
        }}>
          {clovers.map((cl) => (
            <span key={cl.id} className="absolute" style={{
              left: cl.left, top: cl.top,
              fontSize: `${24 * cl.scale}px`,
              opacity: cl.opacity,
              filter: cl.blur ? `blur(${cl.blur}px)` : undefined,
              transform: 'translate(-50%,-50%)',
              animation: `rhgo-cf-sway ${cl.dur}s ease-in-out ${cl.delay}s infinite`,
              willChange: 'transform',
            }}>
              {cl.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Foreground tall grass framing the near edge */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '14%',
        background: 'linear-gradient(to top, hsla(135,60%,18%,0.92), transparent)',
        animation: 'rhgo-cf-drift 7s ease-in-out infinite',
      }} />

      {/* Wandering wildlife (Win95-screensaver style) */}
      {ANIMALS.map((a, i) => (
        <div key={i} className="absolute" style={{
          top: a.top, left: 0, width: '100%', height: 0,
          animation: `rhgo-cf-walk ${a.dur}s linear ${a.delay}s infinite${a.rtl ? ' reverse' : ''}`,
          willChange: 'transform',
        }}>
          <span className="absolute" style={{
            fontSize: `${30 * a.scale}px`,
            transform: a.rtl ? 'scaleX(-1)' : undefined,
            filter: a.fly ? 'drop-shadow(0 4px 6px hsla(0,0%,0%,0.4))' : 'drop-shadow(0 3px 4px hsla(0,0%,0%,0.45))',
            animation: a.fly ? undefined : 'rhgo-cf-bob 1.6s ease-in-out infinite',
            display: 'inline-block',
            marginLeft: '-1.2em',
          }}>
            {a.e}
          </span>
        </div>
      ))}

      {/* Fireflies for magic */}
      {fireflies.map((f) => (
        <span key={f.id} className="absolute rounded-full" style={{
          left: f.left, top: f.top,
          width: f.size, height: f.size,
          background: 'radial-gradient(circle, hsla(55,100%,80%,0.95), hsla(55,100%,60%,0))',
          boxShadow: '0 0 8px hsla(55,100%,70%,0.8)',
          animation: `rhgo-cf-firefly ${f.dur}s ease-in-out ${f.delay}s infinite`,
        }} />
      ))}

      {/* Concave vignette — darkens edges so the field reads as a bowl curving inward */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(120% 100% at 78% 10%, transparent 40%, hsla(140,50%,8%,0.55) 100%)',
      }} />
    </div>
  );
}