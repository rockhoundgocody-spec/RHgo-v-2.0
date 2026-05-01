import React, { useEffect, useRef } from 'react';
import BlackOpalShader from './BlackOpalShader.jsx';
import LiquidGlassShader from './LiquidGlassShader.jsx';
import GasSmokeShader from './GasSmokeShader.jsx';
import ZFightLayers from './ZFightLayers.jsx';
import { cn } from '@/lib/utils';

/**
 * Two-layer black opal orb:
 *   Layer 1 (main): Black opal core with iridescent liquid-gas fire
 *   Layer 2 (overlay): Low-opacity amethyst gas shell for depth + brand tint
 */
export default function AmethystOrb({
  size = 220,
  className = '',
  label,
  sublabel,
  speaking = false,
  getAmplitude,
  getSpectrum,
}) {
  // Drive CSS variables from amplitude + spectrum on each frame — physical pulse,
  // no React re-renders. Spectrum drives the hovering afterglow aura intensity.
  const wrapRef = useRef(null);
  const haloRef = useRef(null);
  const auraRef = useRef(null);
  const auraInnerRef = useRef(null);
  useEffect(() => {
    if (!getAmplitude && !getSpectrum) return;
    let raf;
    const tick = () => {
      const a = getAmplitude ? getAmplitude() || 0 : 0;
      const spec = getSpectrum ? getSpectrum() : { bass: 0, mid: 0, treble: 0 };
      const bass = spec.bass || 0;
      const treble = spec.treble || 0;
      if (wrapRef.current) {
        // body pulse driven by master amp + bass
        wrapRef.current.style.transform = `scale(${1 + a * 0.05 + bass * 0.04})`;
      }
      if (haloRef.current) {
        haloRef.current.style.opacity = String(0.55 + a * 0.45);
        haloRef.current.style.transform = `scale(${1 + a * 0.18 + bass * 0.1})`;
      }
      if (auraRef.current) {
        // outer hovering afterglow — bass swells, treble flickers
        auraRef.current.style.opacity = String(0.65 + a * 0.5 + treble * 0.2);
        auraRef.current.style.transform = `scale(${1 + a * 0.08 + bass * 0.06})`;
      }
      if (auraInnerRef.current) {
        auraInnerRef.current.style.opacity = String(0.55 + a * 0.45);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getAmplitude, getSpectrum]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        'relative transition-transform',
        !getAmplitude && (speaking ? 'animate-orb-speak' : 'animate-amethyst-pulse'),
        className
      )}
      style={{ width: size, height: size, willChange: 'transform' }}
    >
      {/* HOVERING AFTERGLOW — sits outside the orb body, like a floating aura.
          Two stacked layers (outer wide bloom + inner ring) give it depth. */}
      <div
        ref={auraRef}
        aria-hidden
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          // extends well beyond the orb, hovering "above and around" but not on it
          inset: `-${Math.round(size * 0.55)}px`,
          willChange: 'transform, opacity',
          background: speaking
            ? 'radial-gradient(circle, transparent 26%, hsla(280,100%,70%,0.55) 40%, hsla(270,90%,55%,0.45) 56%, hsla(265,80%,45%,0.25) 72%, transparent 88%)'
            : 'radial-gradient(circle, transparent 28%, hsla(280,100%,68%,0.55) 42%, hsla(270,90%,55%,0.42) 58%, hsla(265,80%,45%,0.22) 74%, transparent 90%)',
        }}
      />
      {/* Inner aura ring — tighter, slightly outside the orb edge */}
      <div
        ref={auraInnerRef}
        aria-hidden
        className="pointer-events-none absolute rounded-full blur-2xl"
        style={{
          inset: `-${Math.round(size * 0.22)}px`,
          willChange: 'opacity',
          background: speaking
            ? 'radial-gradient(circle, transparent 44%, hsla(280,100%,75%,0.6) 56%, hsla(270,95%,60%,0.45) 70%, transparent 86%)'
            : 'radial-gradient(circle, transparent 46%, hsla(280,100%,75%,0.6) 58%, hsla(270,95%,60%,0.4) 72%, transparent 88%)',
        }}
      />

      {/* Outer ambient glow — iridescent halo (existing close-in glow) */}
      <div
        ref={haloRef}
        className={cn(
          'absolute inset-0 rounded-full blur-3xl transition-opacity duration-300',
          speaking ? 'opacity-90' : 'opacity-70'
        )}
        style={{
          willChange: 'transform, opacity',
          background: speaking
            ? 'radial-gradient(circle, hsla(145,90%,55%,0.5) 0%, hsla(280,100%,65%,0.4) 40%, hsla(195,100%,60%,0.25) 65%, transparent 80%)'
            : 'radial-gradient(circle, hsla(280,100%,65%,0.45) 0%, hsla(195,100%,55%,0.25) 45%, hsla(330,90%,55%,0.18) 65%, transparent 80%)',
        }}
      />

      <div
        className="relative w-full h-full rounded-full overflow-hidden transition-shadow duration-500"
        style={{
          boxShadow: speaking
            ? '0 0 90px hsla(145,90%,55%,0.5), 0 0 40px hsla(280,100%,70%,0.35)'
            : '0 0 80px hsla(280,100%,55%,0.4), 0 0 30px hsla(195,100%,55%,0.2)',
        }}
      >
        {/* LAYER 1 — Black opal main (audio-reactive via amp + spectrum) */}
        <BlackOpalShader
          intensity={speaking ? 1.85 : 1.5}
          speed={speaking ? 0.55 : 0.32}
          hueShift={speaking ? 1.6 : 0}
          getAmplitude={getAmplitude}
          getSpectrum={getSpectrum}
        />

        {/* LAYER 1.5 — Z-FIGHT: coplanar duplicates with sub-pixel jitter +
            chromatic split. Creates the flickering "two planes occupying the
            same space" look. */}
        <ZFightLayers
          speaking={speaking}
          getAmplitude={getAmplitude}
          getSpectrum={getSpectrum}
        />

        {/* LAYER 2 — Low-opacity iridescent liquid-gas overlay (two-layered depth) */}
        <div className="absolute inset-0 mix-blend-screen opacity-40 pointer-events-none">
          <LiquidGlassShader
            hue={speaking ? 0.36 : 0.78}
            intensity={speaking ? 1.35 : 1.2}
            speed={speaking ? 0.6 : 0.28}
          />
        </div>

        {/* LAYER 6 — Wispy gas/smoke drifting on top (frequency-reactive) */}
        <div className="absolute inset-0 mix-blend-screen opacity-55 pointer-events-none">
          <GasSmokeShader
            speed={speaking ? 0.28 : 0.15}
            getAmplitude={getAmplitude}
            getSpectrum={getSpectrum}
          />
        </div>

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