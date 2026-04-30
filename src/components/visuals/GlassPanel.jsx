import React from 'react';
import { cn } from '@/lib/utils';

export default function GlassPanel({
  children,
  variant = 'amethyst',
  className = '',
  glow = true,
  ...rest
}) {
  const base = variant === 'hud' ? 'hud-panel' : 'glass-panel';
  return (
    <div
      className={cn(
        base,
        'relative rounded-2xl overflow-hidden',
        glow && variant === 'amethyst' && 'shadow-[0_0_60px_-15px_hsla(280,80%,55%,0.4)]',
        glow && variant === 'hud' && 'shadow-[0_0_50px_-15px_hsla(195,100%,55%,0.45)]',
        className
      )}
      {...rest}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-40 mix-blend-screen"
        style={{
          background:
            variant === 'hud'
              ? 'radial-gradient(120% 80% at 50% -20%, hsla(195,100%,70%,0.18) 0%, transparent 60%)'
              : 'radial-gradient(120% 80% at 50% -20%, hsla(280,100%,80%,0.22) 0%, transparent 60%)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}