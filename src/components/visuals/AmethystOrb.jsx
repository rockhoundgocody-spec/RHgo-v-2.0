import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import OrbParticles from './OrbParticles.jsx';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/useReducedMotion';
import usePageVisible from '@/lib/usePageVisible';
import { flowAt, FLOW_ANGLE_DEG } from '@/lib/liquidFlow';

/**
 * Clover — her visual form. A prismatic shell of iridescent liquid glass
 * wrapped around a molten amber core, cut from black volcanic glass.
 * The glow layers, growth rings and liquid motion around her are unchanged.
 */
const CLOVER_SHELL_IMG =
  'https://media.base44.com/images/public/69f35dd14650b54681c835ec/0d03d24e8_generated_9797e11b.png';

// orbState: 'idle' | 'listening' | 'thinking' | 'speaking'
const STATE_CONFIG = {
  idle:      { haloBase: 'hsla(190,100%,62%,0.42)',  auraBase: 'hsla(175,90%,52%,0.42)',   innerBase: 'hsla(330,90%,60%,0.5)',   boxShadow: '0 0 80px hsla(190,100%,55%,0.35), 0 0 30px hsla(330,90%,60%,0.22), 0 0 20px hsla(45,100%,60%,0.15), inset 0 0 50px hsla(265,90%,8%,0.55)',  idlePulseScale: 1.0, idleAuraScale: 1.0 },
  listening: { haloBase: 'hsla(160,90%,55%,0.5)',    auraBase: 'hsla(145,100%,50%,0.5)',   innerBase: 'hsla(190,100%,58%,0.55)', boxShadow: '0 0 90px hsla(145,90%,55%,0.45), 0 0 40px hsla(175,100%,60%,0.3), 0 0 20px hsla(45,100%,60%,0.18), inset 0 0 55px hsla(265,90%,8%,0.55)',  idlePulseScale: 1.4, idleAuraScale: 1.6 },
  thinking:  { haloBase: 'hsla(210,100%,65%,0.45)',  auraBase: 'hsla(260,80%,60%,0.42)',    innerBase: 'hsla(195,100%,58%,0.5)',  boxShadow: '0 0 80px hsla(210,100%,60%,0.4), 0 0 35px hsla(330,90%,60%,0.22), 0 0 20px hsla(45,100%,60%,0.15), inset 0 0 50px hsla(265,90%,8%,0.55)', idlePulseScale: 1.8, idleAuraScale: 2.0 },
  speaking:  { haloBase: 'hsla(330,90%,62%,0.45)',   auraBase: 'hsla(175,90%,55%,0.5)',    innerBase: 'hsla(45,100%,62%,0.55)',  boxShadow: '0 0 90px hsla(330,90%,60%,0.42), 0 0 40px hsla(175,100%,60%,0.3), 0 0 25px hsla(45,100%,65%,0.22), inset 0 0 60px hsla(265,90%,8%,0.6)', idlePulseScale: 2.0, idleAuraScale: 2.2 },
  blessing:  { haloBase: 'hsla(45,100%,65%,0.6)',    auraBase: 'hsla(35,100%,55%,0.6)',    innerBase: 'hsla(280,100%,75%,0.65)', boxShadow: '0 0 110px hsla(45,100%,60%,0.6), 0 0 50px hsla(280,100%,70%,0.4), 0 0 30px hsla(175,100%,60%,0.3), inset 0 0 70px hsla(45,100%,15%,0.65)', idlePulseScale: 2.2, idleAuraScale: 2.4 },
  radar:     { haloBase: 'hsla(195,100%,60%,0.6)',   auraBase: 'hsla(180,100%,50%,0.55)',  innerBase: 'hsla(210,100%,65%,0.6)',  boxShadow: '0 0 100px hsla(195,100%,55%,0.5), 0 0 45px hsla(160,100%,60%,0.35), 0 0 25px hsla(280,100%,65%,0.2), inset 0 0 60px hsla(200,90%,10%,0.6)', idlePulseScale: 1.7, idleAuraScale: 1.9 },
};

// Growth tiers — the orb visually evolves as the user's companion levels up.
// Tier 1 (Sprout): base aura, no growth ring.
// Tier 2 (Bloom): one orbiting growth ring, brighter halo.
// Tier 3 (Radiant): two growth rings, richer colors, intensified glow.
function growthTier(level) {
  if (!level || level < 3) return 1;
  if (level < 5) return 2;
  return 3;
}

export default function AmethystOrb({
  size = 221,
  className = '',
  label,
  sublabel,
  orbState = 'idle',
  speaking = false,        // kept for backwards compat — derived from orbState if not set
  listening = false,
  thinking = false,
  level = 1,               // companion level — drives visual evolution
  getAmplitude,
  getSpectrum,
  getInteraction,          // liquid-metal response to screen interaction
}) {
  const effectiveState = orbState !== 'idle'
    ? orbState
    : thinking ? 'thinking'
    : listening ? 'listening'
    : speaking ? 'speaking'
    : 'idle';
  const tier = growthTier(level);
  // Drive CSS variables from amplitude + spectrum on each frame — physical pulse,
  // no React re-renders. Spectrum drives the hovering afterglow aura intensity.
  const wrapRef = useRef(null);
  const haloRef = useRef(null);
  const auraRef = useRef(null);
  const auraInnerRef = useRef(null);
  const mercuryRef = useRef(null);
  const sheenRef = useRef(null);
  const shadowRef = useRef(null);
  // Phone tilt (-1 … 1 per axis) — she leans and drifts with the device
  const tiltRef = useRef({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  const visible = usePageVisible();

  // Phone tilt — she leans and drifts as the device turns, so she reads as a
  // body floating inside the screen rather than a picture stuck onto it.
  useEffect(() => {
    if (reduceMotion) return;
    const onOrient = (e) => {
      if (e.gamma == null && e.beta == null) return;
      tiltRef.current.x = Math.max(-1, Math.min(1, (e.gamma || 0) / 32));
      tiltRef.current.y = Math.max(-1, Math.min(1, ((e.beta || 0) - 40) / 32));
    };
    const DOE = window.DeviceOrientationEvent;
    let wantsGesture = false;
    if (DOE && typeof DOE.requestPermission === 'function') {
      wantsGesture = true; // iOS needs a grant from a user gesture
    } else if (DOE) {
      window.addEventListener('deviceorientation', onOrient, true);
    }
    const askForTilt = async () => {
      try {
        if ((await DOE.requestPermission()) === 'granted') {
          window.addEventListener('deviceorientation', onOrient, true);
        }
      } catch { /* declined — the pointer lean still applies */ }
    };
    if (wantsGesture) window.addEventListener('pointerdown', askForTilt, { once: true, passive: true });
    return () => {
      window.removeEventListener('deviceorientation', onOrient, true);
      if (wantsGesture) window.removeEventListener('pointerdown', askForTilt);
    };
  }, [reduceMotion]);

  // Smooth state transitions — lerp current config toward target
  const lerpedState = useRef({ pulseScale: 1.0, auraScale: 1.0 });
  // Eased transform values — the orb glides toward its target pose each frame
  // instead of snapping, giving the liquid-metal its buttery follow-through.
  const poseRef = useRef({ tx: 0, ty: 0, scale: 1, rot: 0, haloO: 0.7, haloS: 1, auraO: 0.5, auraS: 1, auraIO: 0.45 });

  useEffect(() => {
    if (!visible) return;
    let raf;
    let inViewport = true;
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
    }, { threshold: 0.05 });
    if (wrapRef.current) observer.observe(wrapRef.current);

    const tick = () => {
      if (!inViewport) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = performance.now() * 0.001;
      const a = getAmplitude ? getAmplitude() || 0 : 0;
      const spec = getSpectrum ? getSpectrum() : { bass: 0, mid: 0, treble: 0 };
      const bass = spec.bass || 0;
      const treble = spec.treble || 0;
      // Live voice level — her mercury skin answers the voice itself, not just the state
      const lvl = Math.min(1, Math.max(a * 1.7, bass * 0.6));

      // Lerp toward target state intensity for smooth transitions
      const cfg = STATE_CONFIG[effectiveState] || STATE_CONFIG.idle;
      lerpedState.current.pulseScale += (cfg.idlePulseScale - lerpedState.current.pulseScale) * 0.04;
      lerpedState.current.auraScale  += (cfg.idleAuraScale  - lerpedState.current.auraScale)  * 0.04;
      const { pulseScale, auraScale } = lerpedState.current;

      // Breathing speed varies by state
      const breathSpeed = effectiveState === 'thinking' ? 1.8 : effectiveState === 'listening' ? 1.1 : 0.85;
      // Her breath is what the eye reads as alive — deep enough to see at rest
      const idlePulse = (Math.sin(t * breathSpeed) * 0.5 + 0.5) * 0.035 * pulseScale;
      const idleAura  = (Math.sin(t * breathSpeed * 0.6 + 1.2) * 0.5 + 0.5) * 0.14 * auraScale;
      // Levitation — she hovers above the surface instead of sitting on it
      const bob = reduceMotion ? 0 : Math.sin(t * 0.55) * size * 0.022;
      const bob01 = Math.sin(t * 0.55) * 0.5 + 0.5;
      // Device tilt — she drifts and leans as the phone turns
      const tilt = reduceMotion ? { x: 0, y: 0 } : tiltRef.current;

      // ── Liquid-metal interaction layer ──────────────────────────────
      // Always-on organic wobble (two offset sine waves) gives the orb a
      // living, liquid quality even at rest. Interaction data from screen
      // adds cursor lean, proximity glow, tap squish, and scroll drift.
      const ix = getInteraction ? getInteraction() : null;
      let leanX = 0, leanY = 0, proxBoost = 0, driftY = 0, squish = 0;

      // Organic liquid wobble — always alive unless reduced-motion
      const wobX = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.006;
      const wobY = reduceMotion ? 0 : Math.cos(t * 0.53) * 0.006;

      if (ix && !reduceMotion) {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const radius = rect.width / 2;
          const dx = ix.pointerX - cx;
          const dy = ix.pointerY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Wider proximity field so dragging anywhere on screen still nudges the orb
          const proximity = Math.max(0, 1 - dist / (radius * 5));
          proxBoost = proximity;

          // Lean toward cursor — now responds across the whole screen, not just near the orb
          const maxLean = size * 0.06;
          leanX = (dx / (radius * 4)) * maxLean * Math.max(0.15, proximity);

          // Velocity-driven momentum lean — dragging across the screen pushes
          // the orb in the gesture direction with smooth follow-through.
          const velLean = ix.velocity * size * 0.035;
          leanX += (ix.dragX || 0) * velLean;
          leanY += (dy / (radius * 4)) * maxLean * Math.max(0.15, proximity)
                 + (ix.dragY || 0) * velLean;

          // Scroll parallax drift
          driftY = ix.scrollV * size * 0.025;

          // Tap squish — quick compress, decays exponentially
          if (ix.tapImpulse > 0.001) {
            squish = ix.tapImpulse * 0.07;
            ix.tapImpulse *= 0.88;
          }

          // Slower velocity decay so momentum glides instead of cutting off
          ix.velocity *= 0.95;
          ix.scrollV *= 0.88;
        }
      }

      const scaleBase = 1 + idlePulse + a * 0.06 + bass * 0.04;
      const velShimmer = ix ? ix.velocity * 0.025 : 0;

      // Target pose for this frame
      const targetTx = leanX + wobX * size + tilt.x * size * 0.05;
      const targetTy = leanY + wobY * size + driftY + bob + tilt.y * size * 0.035;
      const targetRot = tilt.x * 2.5;
      const targetScale = scaleBase - squish + velShimmer;
      const targetScaleY = scaleBase - squish * 0.7 + velShimmer;

      // Ease the actual applied transform toward the target — this lerp is
      // what makes the orb feel liquid: it trails the finger with momentum
      // and settles back softly instead of snapping to each new position.
      const p = poseRef.current;
      p.tx += (targetTx - p.tx) * 0.18;
      p.ty += (targetTy - p.ty) * 0.18;
      p.scale += (targetScale - p.scale) * 0.22;
      p.rot += (targetRot - p.rot) * 0.12;
      const pScaleY = p.scale + (targetScaleY - targetScale) * 0.5;

      if (wrapRef.current) {
        wrapRef.current.style.transform =
          `translate(${p.tx}px, ${p.ty}px) rotate(${p.rot}deg) scale(${p.scale}, ${pScaleY})`;
      }
      // Ground shadow answers the float: higher up, smaller and softer
      if (shadowRef.current) {
        shadowRef.current.style.opacity = String(0.5 - bob01 * 0.2);
        shadowRef.current.style.transform = `scaleX(${0.9 + (1 - bob01) * 0.16})`;
      }

      // Halo + aura also ease for a cohesive liquid follow
      const tHaloO = 0.45 + idleAura + a * 0.45 + proxBoost * 0.22 + lvl * 0.18;
      const tHaloS = 1 + idlePulse * 2 + a * 0.18 + bass * 0.1 + proxBoost * 0.06;
      const tAuraO = 0.5 + idleAura * 1.5 + a * 0.5 + treble * 0.2 + proxBoost * 0.3;
      const tAuraS = 1 + idlePulse * 1.5 + a * 0.08 + bass * 0.06 + proxBoost * 0.04;
      const tAuraIO = 0.45 + idleAura + a * 0.45 + proxBoost * 0.15;

      p.haloO += (tHaloO - p.haloO) * 0.15;
      p.haloS += (tHaloS - p.haloS) * 0.15;
      p.auraO += (tAuraO - p.auraO) * 0.15;
      p.auraS += (tAuraS - p.auraS) * 0.15;
      p.auraIO += (tAuraIO - p.auraIO) * 0.15;

      if (haloRef.current) {
        haloRef.current.style.opacity = String(p.haloO);
        haloRef.current.style.transform = `scale(${p.haloS})`;
      }
      if (auraRef.current) {
        auraRef.current.style.opacity = String(p.auraO);
        auraRef.current.style.transform = `scale(${p.auraS})`;
      }
      if (auraInnerRef.current) {
        auraInnerRef.current.style.opacity = String(p.auraIO);
      }

      // ── Liquid-mercury skin ──────────────────────────────────────────
      // She rides the room's own current: the same diagonal surge the Hub
      // backdrop flows on (src/lib/liquidFlow.js), so shell and backdrop read
      // as one liquid. Voice level brightens, widens and quickens the flow.
      const flow = flowAt(t);
      const swirl = reduceMotion ? 0 : flow.x * 16 + lvl * 22;
      if (mercuryRef.current) {
        mercuryRef.current.style.opacity = String(0.3 + lvl * 0.5);
        mercuryRef.current.style.transform = reduceMotion
          ? 'none'
          : `rotate(${swirl}deg) scale(${1.02 + flow.swell * 0.035 + lvl * 0.06})`;
      }
      if (sheenRef.current) {
        sheenRef.current.style.opacity = String(0.2 + lvl * 0.62);
        sheenRef.current.style.transform = reduceMotion
          ? `scale(${1 + lvl * 0.12})`
          : `translate(${flow.x * size * 0.35}px, ${flow.y * size * 0.35}px) scale(${1 + flow.swell * 0.05 + lvl * 0.22}, ${1 + lvl * 0.45})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [getAmplitude, getSpectrum, getInteraction, visible, effectiveState, reduceMotion, size]);

  const cfg = STATE_CONFIG[effectiveState] || STATE_CONFIG.idle;

  return (
    <div
      ref={wrapRef}
      className={cn('relative isolate', className)}
      style={{ width: size, height: size, willChange: 'transform' }}
    >
      {/* Ground shadow — the contact patch that sells the float */}
      <div
        ref={shadowRef}
        aria-hidden
        className="pointer-events-none absolute rounded-[50%] blur-xl"
        style={{
          left: '16%',
          right: '16%',
          bottom: `-${Math.round(size * 0.18)}px`,
          height: Math.round(size * 0.2),
          background: 'radial-gradient(ellipse at 50% 50%, hsla(265,60%,3%,0.8) 0%, hsla(265,60%,5%,0.4) 52%, transparent 76%)',
          opacity: 0.45,
          willChange: 'transform, opacity',
        }}
      />

      {/* HOVERING AFTERGLOW — outer wide bloom, color shifts per state */}
      <div
        ref={auraRef}
        aria-hidden
        className="pointer-events-none absolute rounded-full blur-3xl transition-[background] duration-700"
        style={{
          inset: `-${Math.round(size * 0.30)}px`,
          willChange: 'transform, opacity',
          background: `radial-gradient(circle, transparent 22%, ${cfg.auraBase} 38%, hsla(190,90%,42%,0.28) 54%, hsla(330,85%,40%,0.18) 72%, transparent 92%)`,
        }}
      />
      {/* Inner aura ring — tighter, color-coded per state */}
      <div
        ref={auraInnerRef}
        aria-hidden
        className="pointer-events-none absolute rounded-full blur-2xl transition-[background] duration-700"
        style={{
          inset: `-${Math.round(size * 0.12)}px`,
          willChange: 'opacity',
          background: `radial-gradient(circle, transparent 40%, ${cfg.innerBase} 54%, hsla(175,90%,45%,0.3) 68%, transparent 88%)`,
        }}
      />

      {/* Outer ambient halo — iridescent, state-tinted. Intensifies with growth tier. */}
      <div
        ref={haloRef}
        className="absolute inset-0 rounded-full blur-3xl transition-[background,opacity] duration-700 opacity-70"
        style={{
          willChange: 'transform, opacity',
          opacity: 0.7 + tier * 0.08,
          background: `radial-gradient(circle, ${cfg.haloBase} 0%, hsla(195,100%,55%,0.2) 45%, hsla(330,90%,55%,0.12) 65%, transparent 80%)`,
        }}
      />

      {/* Drifting glow motes — soft, organic particle field that breathes with her voice */}
      {!reduceMotion && (
        <OrbParticles size={size} getAmplitude={getAmplitude} />
      )}

      {/* Growth rings — orbiting faceted rings that appear as the companion levels up.
          Tier 2: one ring. Tier 3: two counter-rotating rings. */}
      {tier >= 2 && (
        <motion.svg
          width={size * 1.15} height={size * 1.15} viewBox="0 0 240 240"
          className="absolute inset-0 pointer-events-none m-auto"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
          animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        >
          <polygon points="120,18 210,72 210,168 120,222 30,168 30,72" fill="none"
            stroke={tier >= 3 ? 'hsla(45,90%,70%,0.4)' : 'hsla(280,100%,80%,0.3)'} strokeWidth="1" />
        </motion.svg>
      )}
      {tier >= 3 && (
        <motion.svg
          width={size * 1.3} height={size * 1.3} viewBox="0 0 240 240"
          className="absolute inset-0 pointer-events-none m-auto"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
          animate={{ rotate: -360 }} transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        >
          <polygon points="120,8 218,66 218,174 120,232 22,174 22,66" fill="none"
            stroke="hsla(195,100%,70%,0.25)" strokeWidth="0.6" />
        </motion.svg>
      )}

      <div
        className="relative w-full h-full rounded-full overflow-hidden transition-shadow duration-700"
        style={{
          // Concave bowl: dark along the top edge, under-lit along the bottom,
          // so the shell reads as glass with real depth
          boxShadow: `${cfg.boxShadow}, inset 0 ${Math.round(size * 0.11)}px ${Math.round(size * 0.18)}px -${Math.round(size * 0.1)}px hsla(210,75%,6%,0.62), inset 0 -${Math.round(size * 0.1)}px ${Math.round(size * 0.16)}px -${Math.round(size * 0.11)}px hsla(45,100%,84%,0.3)`,
          background: '#FBFDFC',
        }}
      >
        {/* Her form — the prismatic shell she wears: iridescent liquid glass
            over a molten amber core, cut from black volcanic glass. Held just
            inside the rim so the whole mineral silhouette stays visible at any
            size. */}
        <img
          src={CLOVER_SHELL_IMG}
          alt="Clover"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{ transform: 'scale(1.22)' }}
        />

        {/* LIQUID MERCURY SKIN — molten silver flowing across her shell.
            Swirls endlessly; brightens, widens and quickens with the voice. */}
        <div
          ref={mercuryRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            mixBlendMode: 'soft-light',
            opacity: 0.3,
            willChange: 'transform, opacity',
            background: 'conic-gradient(from 200deg, transparent 0deg, hsla(0,0%,100%,0.85) 34deg, hsla(190,100%,88%,0.55) 62deg, transparent 108deg, hsla(285,70%,90%,0.45) 168deg, transparent 232deg, hsla(45,100%,88%,0.6) 296deg, transparent 360deg)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 60%, transparent 78%)',
            maskImage: 'radial-gradient(circle at 50% 50%, #000 60%, transparent 78%)',
          }}
        />
        <div
          ref={sheenRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            mixBlendMode: 'screen',
            opacity: 0.28,
            willChange: 'transform, opacity',
            // Band lies across the flow diagonal, so it sweeps along the same
            // travel line as the dashboard backdrop.
            background: `linear-gradient(${90 + FLOW_ANGLE_DEG}deg, transparent 28%, hsla(0,0%,100%,0.34) 44%, hsla(185,100%,92%,0.5) 50%, hsla(45,100%,90%,0.32) 56%, transparent 72%)`,
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 58%, transparent 76%)',
            maskImage: 'radial-gradient(circle at 50% 50%, #000 58%, transparent 76%)',
          }}
        />

        {/* Specular reflection — the screen's light landing on her glass */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: '21%',
            top: '13%',
            width: '34%',
            height: '19%',
            borderRadius: '9999px',
            background: 'radial-gradient(ellipse at 50% 50%, hsla(0,0%,100%,0.85) 0%, hsla(190,100%,95%,0.45) 42%, transparent 74%)',
            filter: 'blur(3px)',
            transform: 'rotate(-26deg)',
            mixBlendMode: 'screen',
            opacity: 0.5,
          }}
        />

        {/* Frost rim — the hairline edge that seats her in the glass */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            boxShadow: 'inset 0 0 0 1px hsla(0,0%,100%,0.55), inset 0 14px 26px -16px hsla(210,70%,12%,0.45)',
          }}
        />

        {label && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="font-semibold tracking-wider text-lg" style={{ color: '#0a0a14' }}>
              {label}
            </div>
            {sublabel && (
              <div className="text-xs uppercase tracking-[0.3em] mt-1" style={{ color: 'hsla(210,25%,28%,0.85)' }}>
                {sublabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}