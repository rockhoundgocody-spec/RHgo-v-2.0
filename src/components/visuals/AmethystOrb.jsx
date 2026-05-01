import React, { useEffect, useRef } from 'react';
import BlackOpalShader from './BlackOpalShader.jsx';
import LiquidGlassShader from './LiquidGlassShader.jsx';
import GasSmokeShader from './GasSmokeShader.jsx';
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
}) {
  // Drive a CSS scale variable from amplitude on each frame — physical pulse,
  // no React re-renders.
  const wrapRef = useRef(null);
  const haloRef = useRef(null);
  useEffect(() => {
    if (!getAmplitude) return;
    let raf;
    const tick = () => {
      const a = getAmplitude() || 0;
      if (wrapRef.current) {
        wrapRef.current.style.transform = `scale(${1 + a * 0.06})`;
      }
      if (haloRef.current) {
        haloRef.current.style.opacity = String(0.6 + a * 0.4);
        haloRef.current.style.transform = `scale(${1 + a * 0.18})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getAmplitude]);

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
      {/* Outer ambient glow — iridescent halo */}
      <div
        ref={haloRef}
        className={cn(
          'absolute inset-0 rounded-full blur-3xl transition-opacity duration-300',
          speaking ? 'opacity-90' : 'opacity-70'
        )}
        style={{ willChange: 'transform, opacity' }}
        style={{
          background: speaking
            ? 'radial-gradient(circle, hsla(145,90%,55%,0.5) 0%, hsla(280,100%,65%,0.4) 40%, hsla(195,100%,60%,0.25) 65%, transparent 80%)'
            : 'radial-gradient(circle, hsla(280,100%,65%,0.45) 0%, hsla(195,100%,55%,0.25) 45%, hsla(330,90%,55%,0.18) 65%, transparent 80%)',
        }}
      />

      <div
        className="relative w-full h-full rounded-full overflow-hidden border transition-colors duration-500"
        style={{
          borderColor: speaking ? 'hsla(145,90%,70%,0.45)' : 'hsla(270,60%,75%,0.25)',
          boxShadow: speaking
            ? '0 0 90px hsla(145,90%,55%,0.5), 0 0 40px hsla(280,100%,70%,0.35), inset 0 0 30px hsla(0,0%,0%,0.5)'
            : '0 0 80px hsla(280,100%,55%,0.4), 0 0 30px hsla(195,100%,55%,0.2), inset 0 0 35px hsla(0,0%,0%,0.6)',
        }}
      >
        {/* LAYER 1 — Black opal main (audio-reactive via getAmplitude) */}
        <BlackOpalShader
          intensity={speaking ? 1.85 : 1.5}
          speed={speaking ? 0.55 : 0.32}
          hueShift={speaking ? 1.6 : 0}
          getAmplitude={getAmplitude}
        />

        {/* LAYER 2 — Low-opacity iridescent liquid-gas overlay (two-layered depth) */}
        <div className="absolute inset-0 mix-blend-screen opacity-40 pointer-events-none">
          <LiquidGlassShader
            hue={speaking ? 0.36 : 0.78}
            intensity={speaking ? 1.35 : 1.2}
            speed={speaking ? 0.6 : 0.28}
          />
        </div>

        {/* LAYER 6 — Wispy gas/smoke drifting on top */}
        <div className="absolute inset-0 mix-blend-screen opacity-55 pointer-events-none">
          <GasSmokeShader speed={speaking ? 0.28 : 0.15} getAmplitude={getAmplitude} />
        </div>

        {/* Speaking ring pulse */}
        {speaking && (
          <div
            className="pointer-events-none absolute inset-0 mix-blend-screen animate-orb-ring"
            style={{
              background:
                'radial-gradient(circle, transparent 55%, hsla(145,90%,60%,0.4) 72%, transparent 82%)',
            }}
          />
        )}

        {/* Top-left specular highlight — sells the glass sphere */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 30% 24%, hsla(0,0%,100%,0.55) 0%, hsla(0,0%,100%,0) 18%)',
          }}
        />
        {/* Secondary smaller highlight for wet-glass feel */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 38% 30%, hsla(195,100%,90%,0.4) 0%, transparent 6%)',
          }}
        />
        {/* Bottom inner shadow for spherical depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 105%, hsla(0,0%,0%,0.55) 0%, transparent 55%)',
          }}
        />
        {/* Subtle iridescent rim */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, transparent 68%, hsla(280,100%,75%,0.18) 78%, hsla(195,100%,70%,0.12) 88%, transparent 100%)',
          }}
        />

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