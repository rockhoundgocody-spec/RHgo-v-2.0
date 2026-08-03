import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import BlackOpalShader from './BlackOpalShader.jsx';
import WebGPUOpalShader from './WebGPUOpalShader.jsx';
import WebGPUFluidOverlay from './WebGPUFluidOverlay.jsx';
import SphereVolume from './SphereVolume.jsx';
import OrbParticles from './OrbParticles.jsx';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/useReducedMotion';
import usePageVisible from '@/lib/usePageVisible';

/**
 * Two-layer black opal orb:
 *   Layer 1 (main): Black opal core with iridescent liquid-gas fire
 *   Layer 2 (overlay): Low-opacity amethyst gas shell for depth + brand tint
 */
// orbState: 'idle' | 'listening' | 'thinking' | 'speaking'
const STATE_CONFIG = {
  idle:      { haloBase: 'hsla(280,100%,65%,0.45)', auraBase: 'hsla(280,100%,52%,0.5)',  innerBase: 'hsla(280,100%,55%,0.55)', boxShadow: '0 0 80px hsla(280,100%,55%,0.4), 0 0 30px hsla(195,100%,55%,0.2), inset 0 0 50px hsla(265,90%,8%,0.55)',  idlePulseScale: 1.0, idleAuraScale: 1.0 },
  listening: { haloBase: 'hsla(160,90%,55%,0.55)',  auraBase: 'hsla(145,100%,50%,0.55)', innerBase: 'hsla(150,100%,58%,0.6)',  boxShadow: '0 0 90px hsla(145,90%,55%,0.5), 0 0 40px hsla(160,100%,60%,0.3), inset 0 0 55px hsla(265,90%,8%,0.55)',  idlePulseScale: 1.4, idleAuraScale: 1.6 },
  thinking:  { haloBase: 'hsla(210,100%,65%,0.5)',  auraBase: 'hsla(220,100%,55%,0.5)',  innerBase: 'hsla(215,100%,58%,0.55)', boxShadow: '0 0 80px hsla(215,100%,60%,0.45), 0 0 35px hsla(200,100%,55%,0.25), inset 0 0 50px hsla(265,90%,8%,0.55)', idlePulseScale: 1.8, idleAuraScale: 2.0 },
  speaking:  { haloBase: 'hsla(145,90%,55%,0.5)',   auraBase: 'hsla(280,100%,55%,0.55)', innerBase: 'hsla(280,100%,58%,0.6)',  boxShadow: '0 0 90px hsla(145,90%,55%,0.5), 0 0 40px hsla(280,100%,70%,0.35), inset 0 0 60px hsla(265,90%,8%,0.6)', idlePulseScale: 2.0, idleAuraScale: 2.2 },
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
  level = 1,               // companion level — drives visual evolution
  getAmplitude,
  getSpectrum,
  getInteraction,          // liquid-metal response to screen interaction
}) {
  const effectiveState = orbState !== 'idle' ? orbState : (speaking ? 'speaking' : 'idle');
  const tier = growthTier(level);
  // Drive CSS variables from amplitude + spectrum on each frame — physical pulse,
  // no React re-renders. Spectrum drives the hovering afterglow aura intensity.
  const wrapRef = useRef(null);
  const haloRef = useRef(null);
  const auraRef = useRef(null);
  const auraInnerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const visible = usePageVisible();
  // Try WebGPU first; fall back to WebGL shader if unsupported / init fails.
  // Reduced-motion users get the lighter WebGL path AND no fluid overlay.
  const [useWebGPU, setUseWebGPU] = useState(
    typeof navigator !== 'undefined' && !!navigator.gpu && !detectInitialReduce()
  );
  // Smooth state transitions — lerp current config toward target
  const lerpedState = useRef({ pulseScale: 1.0, auraScale: 1.0 });
  // Eased transform values — the orb glides toward its target pose each frame
  // instead of snapping, giving the liquid-metal its buttery follow-through.
  const poseRef = useRef({ tx: 0, ty: 0, scale: 1, haloO: 0.7, haloS: 1, auraO: 0.5, auraS: 1, auraIO: 0.45 });

  useEffect(() => {
    if (!visible) return;
    let raf;
    const tick = () => {
      const t = performance.now() * 0.001;
      const a = getAmplitude ? getAmplitude() || 0 : 0;
      const spec = getSpectrum ? getSpectrum() : { bass: 0, mid: 0, treble: 0 };
      const bass = spec.bass || 0;
      const treble = spec.treble || 0;

      // Lerp toward target state intensity for smooth transitions
      const cfg = STATE_CONFIG[effectiveState] || STATE_CONFIG.idle;
      lerpedState.current.pulseScale += (cfg.idlePulseScale - lerpedState.current.pulseScale) * 0.04;
      lerpedState.current.auraScale  += (cfg.idleAuraScale  - lerpedState.current.auraScale)  * 0.04;
      const { pulseScale, auraScale } = lerpedState.current;

      // Breathing speed varies by state
      const breathSpeed = effectiveState === 'thinking' ? 1.8 : effectiveState === 'listening' ? 1.1 : 0.7;
      const idlePulse = (Math.sin(t * breathSpeed) * 0.5 + 0.5) * 0.018 * pulseScale;
      const idleAura  = (Math.sin(t * breathSpeed * 0.6 + 1.2) * 0.5 + 0.5) * 0.12 * auraScale;

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
      const targetTx = leanX + wobX * size;
      const targetTy = leanY + wobY * size + driftY;
      const targetScale = scaleBase - squish + velShimmer;
      const targetScaleY = scaleBase - squish * 0.7 + velShimmer;

      // Ease the actual applied transform toward the target — this lerp is
      // what makes the orb feel liquid: it trails the finger with momentum
      // and settles back softly instead of snapping to each new position.
      const p = poseRef.current;
      p.tx += (targetTx - p.tx) * 0.18;
      p.ty += (targetTy - p.ty) * 0.18;
      p.scale += (targetScale - p.scale) * 0.22;
      const pScaleY = p.scale + (targetScaleY - targetScale) * 0.5;

      if (wrapRef.current) {
        wrapRef.current.style.transform =
          `translate(${p.tx}px, ${p.ty}px) scale(${p.scale}, ${pScaleY})`;
      }

      // Halo + aura also ease for a cohesive liquid follow
      const tHaloO = 0.45 + idleAura + a * 0.45 + proxBoost * 0.22;
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
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getAmplitude, getSpectrum, getInteraction, visible, effectiveState, reduceMotion, size]);

  const cfg = STATE_CONFIG[effectiveState] || STATE_CONFIG.idle;

  return (
    <div
      ref={wrapRef}
      className={cn(
        'relative transition-transform isolate',
        !getAmplitude && (effectiveState === 'speaking' ? 'animate-orb-speak' : 'animate-amethyst-pulse'),
        className
      )}
      style={{ width: size, height: size, willChange: 'transform' }}
    >
      {/* HOVERING AFTERGLOW — outer wide bloom, color shifts per state */}
      <div
        ref={auraRef}
        aria-hidden
        className="pointer-events-none absolute rounded-full blur-3xl transition-[background] duration-700"
        style={{
          inset: `-${Math.round(size * 0.30)}px`,
          willChange: 'transform, opacity',
          background: `radial-gradient(circle, transparent 22%, ${cfg.auraBase} 38%, hsla(270,95%,42%,0.35) 54%, hsla(265,85%,32%,0.18) 72%, transparent 92%)`,
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
          background: `radial-gradient(circle, transparent 40%, ${cfg.innerBase} 54%, hsla(270,98%,45%,0.35) 68%, transparent 88%)`,
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
        style={{ boxShadow: cfg.boxShadow }}
      >
        {/* LAYER 1 — Black opal main (audio-reactive via amp + spectrum)
            WebGPU + TSL when available; WebGL fallback otherwise. */}
        <div className="absolute inset-0">
          {useWebGPU ? (
            <WebGPUOpalShader
              intensity={effectiveState === 'speaking' ? 1.85 : effectiveState === 'listening' ? 1.65 : effectiveState === 'thinking' ? 1.7 : 1.5}
              speed={effectiveState === 'speaking' ? 0.55 : effectiveState === 'thinking' ? 0.48 : effectiveState === 'listening' ? 0.42 : 0.32}
              hueShift={effectiveState === 'speaking' ? 1.6 : effectiveState === 'listening' ? 0.8 : effectiveState === 'thinking' ? 1.2 : 0}
              getAmplitude={getAmplitude}
              getSpectrum={getSpectrum}
              onUnsupported={() => setUseWebGPU(false)}
            />
          ) : (
            <BlackOpalShader
              intensity={effectiveState === 'speaking' ? 1.85 : effectiveState === 'listening' ? 1.65 : effectiveState === 'thinking' ? 1.7 : 1.5}
              speed={effectiveState === 'speaking' ? 0.55 : effectiveState === 'thinking' ? 0.48 : effectiveState === 'listening' ? 0.42 : 0.32}
              hueShift={effectiveState === 'speaking' ? 1.6 : effectiveState === 'listening' ? 0.8 : effectiveState === 'thinking' ? 1.2 : 0}
              getAmplitude={getAmplitude}
              getSpectrum={getSpectrum}
            />
          )}
        </div>

        {/* LAYER 1.5 — Real compute fluid overlay (WebGPU only).
            Disabled entirely under reduced-motion or when speaking is off
            on idle Hub view to save GPU. */}
        {useWebGPU && !reduceMotion && speaking && (
          <div className="absolute inset-0">
            <WebGPUFluidOverlay
              resolution={96}
              intensity={1.4}
              getAmplitude={getAmplitude}
              getSpectrum={getSpectrum}
              onUnsupported={() => setUseWebGPU(false)}
            />
          </div>
        )}

        {/* Amethyst tint wash — light touch so opal iridescence shines through */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, hsla(280,100%,75%,0.25) 0%, hsla(270,90%,50%,0.15) 45%, hsla(265,90%,20%,0.35) 80%, hsla(260,90%,8%,0.5) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-25"
          style={{
            background:
              'radial-gradient(circle at 65% 70%, hsla(290,100%,70%,0.3) 0%, transparent 60%)',
          }}
        />

        {/* Volumetric sphere shading — pure CSS, no WebGL context */}
        <SphereVolume />

        {label && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="text-white/95 font-semibold tracking-wider text-lg glow-amethyst">
              {label}
            </div>
            {sublabel && (
              <div className="text-amethyst/80 text-xs uppercase tracking-[0.3em] mt-1">
                {sublabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function detectInitialReduce() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  const lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
  const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  return !!(lowMem || lowCores);
}