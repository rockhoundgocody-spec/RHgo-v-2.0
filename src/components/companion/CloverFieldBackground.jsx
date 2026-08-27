/**
 * CloverFieldBackground — a layered, depth-aware vista that stretches off
 * into the distance toward a left-to-right horizon, sitting behind the HUD.
 *
 * Layers (back → front):
 *   sky · sun + god rays · distant tree line · mid tree line · horizon haze ·
 *   ground · depth-distributed clover field (far / mid / near, parallax) ·
 *   wandering wildlife · fireflies · sunlit pollen · foreground grass ·
 *   depth fog + vignette · slow camera breathing.
 *
 * Pure SVG/CSS — no WebGL — so it stays light on mobile. pointer-events:none.
 */
import React, { useMemo } from 'react';

/* ───────────────────────────────────────────────────────────────────────── */
/* Keyframes (prefixed cf2- to avoid collisions with the old component)      */
/* ───────────────────────────────────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes cf2-sway      { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
@keyframes cf2-sway-soft { 0%,100%{transform:rotate(-1.4deg)} 50%{transform:rotate(1.4deg)} }
@keyframes cf2-walk      { 0%{transform:translateX(-14vw)} 100%{transform:translateX(116vw)} }
@keyframes cf2-bob       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes cf2-firefly   {
  0%   {transform:translate(0,0);    opacity:0}
  12%  {opacity:.9}
  50%  {transform:translate(26px,-30px); opacity:.55}
  88%  {opacity:.35}
  100% {transform:translate(-14px,-64px); opacity:0}
}
@keyframes cf2-pollen {
  0%   {transform:translate(0,0) scale(.7); opacity:0}
  15%  {opacity:.7}
  85%  {opacity:.5}
  100% {transform:translate(-46px,-120px) scale(1.1); opacity:0}
}
@keyframes cf2-ray    { 0%,100%{opacity:.10} 50%{opacity:.30} }
@keyframes cf2-glow   { 0%,100%{opacity:.55; transform:scale(1)} 50%{opacity:.8; transform:scale(1.06)} }
@keyframes cf2-haze   { 0%,100%{opacity:.5} 50%{opacity:.75} }
@keyframes cf2-breathe{ 0%,100%{transform:scale(1.0) translateX(0)} 50%{transform:scale(1.025) translateX(-6px)} }
@keyframes cf2-breathe-near { 0%,100%{transform:scale(1.03) translateX(0)} 50%{transform:scale(1.06) translateX(8px)} }
@keyframes cf2-blade  { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
`;

/* Horizon line position (% from top). Everything recedes toward this line. */
const HORIZON = 31;

/* Deterministic RNG so the field layout is stable across renders. */
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ───────────────────────────────────────────────────────────────────────── */
/* Custom SVG clover — four leaves, stem, center, vein detail.              */
/* ───────────────────────────────────────────────────────────────────────── */
const LEAF = 'M50,50 C33,41 33,19 50,15 C67,19 67,41 50,50 Z';

function CloverSvg({ fillId, rot }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block', transform: `rotate(${rot}deg)`, overflow: 'visible' }}>
      <g>
        {/* stem */}
        <path d="M50,50 Q46.5,72 50.5,95" stroke={`url(#${fillId})`} strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.92" />
        {/* four leaves */}
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 50 50)`}>
            <path d={LEAF} fill={`url(#${fillId})`} />
            {/* vein */}
            <path d="M50,18 Q50,33 50,47" stroke="rgba(20,60,30,0.28)" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            {/* sheen */}
            <path d="M44,24 Q40,32 43,40" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        ))}
        {/* center knot */}
        <circle cx="50" cy="50" r="4.6" fill={`url(#${fillId})`} />
        <circle cx="48.5" cy="48.5" r="1.6" fill="rgba(255,255,255,0.4)" />
      </g>
    </svg>
  );
}

/* Shared gradient defs — four natural tints, referenced by all clovers. */
function GradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <radialGradient id="cf2-g-near" cx="42%" cy="30%" r="75%">
          <stop offset="0%" stopColor="hsl(128,72%,52%)" />
          <stop offset="55%" stopColor="hsl(132,60%,38%)" />
          <stop offset="100%" stopColor="hsl(138,58%,26%)" />
        </radialGradient>
        <radialGradient id="cf2-g-mid" cx="42%" cy="30%" r="75%">
          <stop offset="0%" stopColor="hsl(126,55%,46%)" />
          <stop offset="60%" stopColor="hsl(134,50%,34%)" />
          <stop offset="100%" stopColor="hsl(142,48%,24%)" />
        </radialGradient>
        <radialGradient id="cf2-g-far" cx="42%" cy="30%" r="75%">
          <stop offset="0%" stopColor="hsl(124,42%,40%)" />
          <stop offset="100%" stopColor="hsl(146,40%,28%)" />
        </radialGradient>
        <radialGradient id="cf2-g-gold" cx="42%" cy="30%" r="75%">
          <stop offset="0%" stopColor="hsl(118,70%,58%)" />
          <stop offset="60%" stopColor="hsl(86,54%,46%)" />
          <stop offset="100%" stopColor="hsl(70,48%,34%)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* Clover field — depth-distributed across three parallax layers.           */
/* ───────────────────────────────────────────────────────────────────────── */
function buildClovers(seed, count, dMin, dMax, fillPool) {
  const rng = makeRng(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = dMin + rng() * (dMax - dMin);            // 0 far .. 1 near
    const edgePad = 4 + (1 - d) * 2;                    // keep near ones off the edge
    const left = edgePad + rng() * (100 - edgePad * 2);
    const top = HORIZON + d * (99 - HORIZON) + (rng() - 0.5) * 2.4;
    const size = 10 + Math.pow(d, 1.7) * 96;            // px
    const opacity = 0.2 + d * 0.74;
    const blur = (1 - d) * 2.7;
    const swayDeg = 0.6 + d * 3.4;
    const dur = 4.6 - d * 2.1 + rng() * 0.9;
    const delay = rng() * 5;
    const rot = (rng() - 0.5) * 16;
    const fillId = fillPool[Math.floor(rng() * fillPool.length)];
    out.push({ id: `${seed}-${i}`, left, top, size, opacity, blur, swayDeg, dur, delay, rot, fillId, shadow: d > 0.72 });
  }
  return out;
}

function CloverLayer({ clovers, soft, breathe }) {
  return (
    <div className="absolute inset-0" style={{ animation: breathe, willChange: 'transform', transformOrigin: '60% 100%' }}>
      {clovers.map((c) => (
        <div key={c.id} className="absolute" style={{
          left: `${c.left}%`, top: `${c.top}%`,
          width: c.size, height: c.size,
          transform: 'translate(-50%,-100%)',
          opacity: c.opacity,
          filter: c.blur ? `blur(${c.blur}px)` : undefined,
          willChange: 'transform',
        }}>
          {/* grounding shadow for near clovers */}
          {c.shadow && (
            <div className="absolute" style={{
              left: '50%', bottom: '-6%',
              width: `${c.size * 0.62}px`, height: `${c.size * 0.12}px`,
              transform: 'translateX(-50%)',
              background: 'radial-gradient(closest-side, hsla(140,50%,6%,0.34), transparent 78%)',
              filter: 'blur(1.5px)',
            }} />
          )}
          <div style={{
            animation: `${soft ? 'cf2-sway-soft' : 'cf2-sway'} ${c.dur}s ease-in-out ${c.delay}s infinite`,
            transformOrigin: '50% 92%',
            willChange: 'transform',
          }}>
            <CloverSvg fillId={c.fillId} rot={c.rot} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* Distant tree line — rolling forest silhouette along the horizon.          */
/* ───────────────────────────────────────────────────────────────────────── */
function makeTreeLine(seed, segs, baseY, amp, jag) {
  const rng = makeRng(seed);
  let d = `M0,100 L0,${baseY}`;
  const step = 1000 / segs;
  for (let i = 0; i <= segs; i++) {
    const x = i * step;
    const roll = Math.sin(i * 0.6 + seed * 0.13) * amp * 0.5 + Math.sin(i * 1.7) * amp * 0.3;
    const tree = rng() < 0.34 ? rng() * jag : 0;
    const y = baseY - roll - tree;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d} L1000,100 Z`;
}

/* ───────────────────────────────────────────────────────────────────────── */
/* Foreground grass blades framing the near edge.                          */
/* ───────────────────────────────────────────────────────────────────────── */
function GrassBlade({ left, height, lean, dur, delay, hue }) {
  return (
    <div className="absolute bottom-0" style={{
      left: `${left}%`,
      width: 0, height: 0,
      animation: `cf2-blade ${dur}s ease-in-out ${delay}s infinite`,
      transformOrigin: 'bottom center',
      willChange: 'transform',
    }}>
      <svg width="14" height={height} viewBox="0 0 14 100" preserveAspectRatio="none"
        style={{ display: 'block', transform: `translateX(-50%) rotate(${lean}deg)`, overflow: 'visible' }}>
        <path d="M7,100 Q5,55 7,2 Q9,55 7,100 Z" fill={hue} />
        <path d="M7,96 Q6,55 7,8" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
      </svg>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* Wandering wildlife — depth-appropriate bands.                           */
/* ───────────────────────────────────────────────────────────────────────── */
const ANIMALS = [
  { e: '🦅', top: '14%', dur: 26, delay: 2,  rtl: true,  scale: 0.7, fly: true },
  { e: '🦌', top: '52%', dur: 30, delay: 0,  rtl: false, scale: 0.8 },
  { e: '🦊', top: '60%', dur: 24, delay: 12, rtl: false, scale: 0.7 },
  { e: '🐰', top: '70%', dur: 14, delay: 6,  rtl: true,  scale: 0.6 },
  { e: '🐿️', top: '78%', dur: 12, delay: 4,  rtl: true,  scale: 0.52 },
  { e: '🐢', top: '86%', dur: 46, delay: 18, rtl: false, scale: 0.5 },
];

export default function CloverFieldBackground() {
  const farClovers  = useMemo(() => buildClovers(20260801, 30, 0.0, 0.34, ['cf2-g-far']), []);
  const midClovers  = useMemo(() => buildClovers(20260802, 22, 0.34, 0.66, ['cf2-g-mid', 'cf2-g-gold']), []);
  const nearClovers = useMemo(() => buildClovers(20260803, 16, 0.66, 1.0,  ['cf2-g-near', 'cf2-g-gold']), []);

  const fireflies = useMemo(() => {
    const rng = makeRng(7712);
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      left: `${12 + rng() * 76}%`,
      top: `${40 + rng() * 46}%`,
      delay: rng() * 8,
      dur: 6 + rng() * 5,
      size: 3 + rng() * 3,
    }));
  }, []);

  const pollen = useMemo(() => {
    const rng = makeRng(4242);
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: `${48 + rng() * 44}%`,
      top: `${22 + rng() * 50}%`,
      delay: rng() * 9,
      dur: 9 + rng() * 7,
      size: 2 + rng() * 2.4,
    }));
  }, []);

  const grass = useMemo(() => {
    const rng = makeRng(99081);
    const hues = ['hsl(132,58%,24%)', 'hsl(128,54%,28%)', 'hsl(140,52%,20%)', 'hsl(124,56%,30%)'];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: (i / 22) * 100 + (rng() - 0.5) * 4,
      height: 26 + rng() * 30,
      lean: (rng() - 0.5) * 16,
      dur: 2.6 + rng() * 1.8,
      delay: rng() * 3,
      hue: hues[Math.floor(rng() * hues.length)],
    }));
  }, []);

  const treeFar = useMemo(() => makeTreeLine(11, 26, 52, 7, 11), []);
  const treeMid = useMemo(() => makeTreeLine(77, 20, 46, 9, 14), []);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <style>{KEYFRAMES}</style>
      <GradientDefs />

      {/* ── Sky ─────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(120% 80% at 72% 4%, hsla(42,92%,74%,0.40) 0%, hsla(38,72%,56%,0.14) 24%, hsla(0,0%,0%,0) 50%),
          linear-gradient(172deg,
            hsl(196,40%,22%) 0%,
            hsl(178,38%,26%) 14%,
            hsl(150,40%,24%) 34%,
            hsl(140,48%,28%) 60%,
            hsl(132,54%,32%) 100%)
        `,
      }} />

      {/* ── Sun glow at the horizon (right of center) ────────────────────── */}
      <div className="absolute" style={{
        top: `${HORIZON - 16}%`, left: '62%', width: '46%', height: '40%',
        transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(closest-side, hsla(46,96%,82%,0.85), hsla(40,88%,66%,0.32) 42%, transparent 72%)',
        filter: 'blur(6px)',
        animation: 'cf2-glow 8s ease-in-out infinite',
        willChange: 'transform,opacity',
      }} />

      {/* ── God rays angling down from the sun ──────────────────────────── */}
      {[ -18, -8, 4, 14 ].map((deg, i) => (
        <div key={i} className="absolute" style={{
          top: `${HORIZON - 22}%`, left: '60%',
          width: '4.5%', height: '150%',
          transform: `translate(-50%,-50%) rotate(${deg}deg)`,
          transformOrigin: 'top center',
          background: 'linear-gradient(to bottom, hsla(48,96%,80%,0.0) 0%, hsla(48,96%,80%,0.5) 18%, hsla(44,90%,72%,0.18) 60%, transparent 100%)',
          filter: 'blur(5px)',
          animation: `cf2-ray ${7 + i}s ease-in-out ${i * 1.1}s infinite`,
          willChange: 'opacity',
        }} />
      ))}

      {/* ── Distant tree line (hazy, low contrast) ──────────────────────── */}
      <div className="absolute" style={{
        top: `${HORIZON - 9}%`, left: 0, width: '100%', height: '20%',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d={treeFar} fill="hsl(146,34%,30%)" opacity="0.6" />
        </svg>
      </div>

      {/* ── Mid tree line (sharper, darker) ─────────────────────────────── */}
      <div className="absolute" style={{
        top: `${HORIZON - 4}%`, left: 0, width: '100%', height: '16%',
        filter: 'blur(0.4px)',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d={treeMid} fill="hsl(140,46%,20%)" opacity="0.85" />
        </svg>
      </div>

      {/* ── Horizon haze band (atmospheric depth fog at the vanishing line) */}
      <div className="absolute" style={{
        top: `${HORIZON - 3}%`, left: 0, width: '100%', height: '14%',
        background: 'linear-gradient(to bottom, hsla(44,70%,72%,0.0) 0%, hsla(44,60%,70%,0.30) 45%, hsla(140,40%,40%,0.05) 100%)',
        filter: 'blur(3px)',
        animation: 'cf2-haze 11s ease-in-out infinite',
        willChange: 'opacity',
      }} />

      {/* ── Ground gradient (warmer near, cooler far) ────────────────────── */}
      <div className="absolute" style={{
        top: `${HORIZON}%`, left: 0, width: '100%', height: `${100 - HORIZON}%`,
        background: `linear-gradient(to bottom,
          hsl(140,44%,30%) 0%,
          hsl(136,50%,26%) 30%,
          hsl(132,54%,22%) 70%,
          hsl(128,56%,18%) 100%)`,
      }} />

      {/* ── Clover field — three parallax depth layers ───────────────────── */}
      <CloverLayer clovers={farClovers}  soft breathe="cf2-breathe 17s ease-in-out infinite" />
      <CloverLayer clovers={midClovers}  soft={false} breathe="cf2-breathe 14s ease-in-out infinite" />
      <CloverLayer clovers={nearClovers} soft={false} breathe="cf2-breathe-near 11s ease-in-out infinite" />

      {/* ── Wandering wildlife ──────────────────────────────────────────── */}
      {ANIMALS.map((a, i) => (
        <div key={i} className="absolute" style={{
          top: a.top, left: 0, width: '100%', height: 0,
          animation: `cf2-walk ${a.dur}s linear ${a.delay}s infinite${a.rtl ? ' reverse' : ''}`,
          willChange: 'transform',
        }}>
          <span className="absolute" style={{
            fontSize: `${30 * a.scale}px`,
            transform: a.rtl ? 'scaleX(-1)' : undefined,
            filter: a.fly ? 'drop-shadow(0 5px 7px hsla(0,0%,0%,0.4))' : 'drop-shadow(0 3px 4px hsla(0,0%,0%,0.5))',
            animation: a.fly ? undefined : 'cf2-bob 1.6s ease-in-out infinite',
            display: 'inline-block',
            marginLeft: '-1.2em',
          }}>
            {a.e}
          </span>
        </div>
      ))}

      {/* ── Fireflies (mid-field magic) ─────────────────────────────────── */}
      {fireflies.map((f) => (
        <span key={f.id} className="absolute rounded-full" style={{
          left: f.left, top: f.top,
          width: f.size, height: f.size,
          background: 'radial-gradient(circle, hsla(55,100%,82%,0.95), hsla(55,100%,60%,0))',
          boxShadow: '0 0 9px hsla(55,100%,72%,0.85)',
          animation: `cf2-firefly ${f.dur}s ease-in-out ${f.delay}s infinite`,
          willChange: 'transform,opacity',
        }} />
      ))}

      {/* ── Sunlit pollen drifting through the light shafts ─────────────── */}
      {pollen.map((p) => (
        <span key={p.id} className="absolute rounded-full" style={{
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          background: 'radial-gradient(circle, hsla(48,100%,86%,0.9), hsla(46,100%,70%,0))',
          boxShadow: '0 0 5px hsla(48,100%,78%,0.6)',
          animation: `cf2-pollen ${p.dur}s ease-in-out ${p.delay}s infinite`,
          willChange: 'transform,opacity',
        }} />
      ))}

      {/* ── Foreground grass blades ─────────────────────────────────────── */}
      {grass.map((g) => (
        <GrassBlade key={g.id} left={g.left} height={g.height} lean={g.lean} dur={g.dur} delay={g.delay} hue={g.hue} />
      ))}

      {/* ── Foreground ground shadow anchoring the near edge ────────────── */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '12%',
        background: 'linear-gradient(to top, hsla(130,56%,10%,0.92), transparent)',
      }} />

      {/* ── Depth fog + vignette (darken edges so the bowl reads inward) ── */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(130% 90% at 62% ${HORIZON}%, transparent 38%, hsla(140,50%,6%,0.5) 100%),
          linear-gradient(to right, hsla(140,50%,6%,0.28) 0%, transparent 22%, transparent 78%, hsla(140,50%,6%,0.34) 100%)`,
      }} />
    </div>
  );
}