import React from 'react';
import { cn } from '@/lib/utils';

export default function HudFrame({ children, label, className = '' }) {
  return (
    <div className={cn('relative', className)}>
      {/* corner brackets */}
      {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'].map((p, i) => (
        <div
          key={i}
          className={cn('absolute w-4 h-4 pointer-events-none', p)}
          style={{
            borderTop: '2px solid hsl(var(--hud-cyan))',
            borderLeft: '2px solid hsl(var(--hud-cyan))',
            filter: 'drop-shadow(0 0 4px hsl(var(--hud-cyan)))',
          }}
        />
      ))}
      {label && (
        <div className="absolute -top-2.5 left-4 px-2 text-[10px] tracking-[0.3em] uppercase text-hud bg-background/90 z-10">
          {label}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}