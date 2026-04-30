import React from 'react';
import LiquidGlassShader from './LiquidGlassShader.jsx';
import { cn } from '@/lib/utils';

export default function AmethystOrb({
  size = 220,
  className = '',
  label,
  sublabel,
  speaking = false,
}) {
  return (
    <div
      className={cn(
        'relative',
        speaking ? 'animate-orb-speak' : 'animate-amethyst-pulse',
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Outer glow — gains a green halo while speaking */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-3xl transition-opacity duration-500',
          speaking ? 'opacity-90' : 'opacity-70'
        )}
        style={{
          background: speaking
            ? 'radial-gradient(circle, hsla(145,90%,60%,0.55) 0%, hsla(280,100%,70%,0.45) 45%, hsla(265,80%,40%,0.2) 70%, transparent 80%)'
            : 'radial-gradient(circle, hsla(280,100%,70%,0.55) 0%, hsla(265,80%,40%,0.2) 50%, transparent 75%)',
        }}
      />

      <div
        className={cn(
          'relative w-full h-full rounded-full overflow-hidden border transition-colors duration-500',
          speaking
            ? 'border-emerald-300/50'
            : 'border-amethyst-glow/30'
        )}
        style={{
          boxShadow: speaking
            ? '0 0 90px hsla(145,90%,55%,0.55), 0 0 40px hsla(280,100%,70%,0.35), inset 0 0 40px hsla(265,90%,30%,0.6)'
            : '0 0 80px hsla(280,100%,60%,0.45), inset 0 0 40px hsla(265,90%,30%,0.6)',
        }}
      >
        <LiquidGlassShader
          hue={speaking ? 0.36 : 0.78}
          intensity={speaking ? 1.25 : 1.05}
          speed={speaking ? 0.42 : 0.18}
        />

        {/* green energy ring overlay while speaking */}
        {speaking && (
          <div
            className="pointer-events-none absolute inset-0 mix-blend-screen animate-orb-ring"
            style={{
              background:
                'radial-gradient(circle, transparent 55%, hsla(145,90%,60%,0.45) 70%, transparent 80%)',
            }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, hsla(0,0%,100%,0.45) 0%, hsla(0,0%,100%,0) 22%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 100%, hsla(265,90%,15%,0.7) 0%, transparent 55%)',
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