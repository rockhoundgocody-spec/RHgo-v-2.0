import React from 'react';
import LiquidGlassShader from './LiquidGlassShader';
import { cn } from '@/lib/utils';

export default function AmethystOrb({ size = 220, className = '', label, sublabel }) {
  return (
    <div
      className={cn('relative animate-amethyst-pulse', className)}
      style={{ width: size, height: size }}
    >
      {/* outer glow halo */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-70"
        style={{
          background:
            'radial-gradient(circle, hsla(280,100%,70%,0.55) 0%, hsla(265,80%,40%,0.2) 50%, transparent 75%)',
        }}
      />
      {/* shader sphere */}
      <div className="relative w-full h-full rounded-full overflow-hidden border border-amethyst-glow/30 shadow-[0_0_80px_hsla(280,100%,60%,0.45),inset_0_0_40px_hsla(265,90%,30%,0.6)]">
        <LiquidGlassShader hue={0.78} intensity={1.05} speed={0.18} />
        {/* inner concave reflection */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, hsla(0,0%,100%,0.45) 0%, hsla(0,0%,100%,0) 22%)',
          }}
        />
        {/* bottom shadow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 100%, hsla(265,90%,15%,0.7) 0%, transparent 55%)',
          }}
        />
        {/* center label */}
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