import React from 'react';

/**
 * SignalMeter — vertical bar showing AI lock-on confidence (0..1).
 * Used as a side gauge on the live camera HUD.
 */
export default function SignalMeter({ value = 0, label = 'SIGNAL' }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const color = value > 0.75 ? 'hsl(145 90% 55%)' : value > 0.4 ? 'hsl(50 95% 60%)' : 'hsl(195 100% 60%)';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/60">{label}</div>
      <div
        className="relative w-2 h-32 rounded-full overflow-hidden"
        style={{ background: 'hsla(220,40%,8%,0.6)', border: '1px solid hsla(195,80%,40%,0.3)' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-200"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(to top, ${color}, hsla(280,100%,70%,0.8))`,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
        {/* tick marks */}
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="absolute left-0 right-0 h-px bg-white/20"
            style={{ bottom: `${p}%` }}
          />
        ))}
      </div>
      <div className="text-[10px] font-mono text-white/80">{Math.round(pct)}%</div>
    </div>
  );
}