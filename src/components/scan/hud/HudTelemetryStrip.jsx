import React, { useEffect, useState } from 'react';

/**
 * HudTelemetryStrip — top status bar with system metrics.
 * Looks like a flight HUD's data row.
 */
export default function HudTelemetryStrip({ status = 'STANDBY', signal = 0 }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const fps = 60 - Math.round(Math.sin(tick * 0.4) * 3);
  const pct = Math.round(signal * 100);

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.3em]"
      style={{
        background: 'linear-gradient(90deg, hsla(215,80%,8%,0.75) 0%, hsla(220,70%,5%,0.85) 100%)',
        borderTop: '1px solid hsla(195,100%,60%,0.35)',
        borderBottom: '1px solid hsla(195,100%,60%,0.35)',
        boxShadow: 'inset 0 1px 0 hsla(195,100%,80%,0.1), 0 0 16px hsla(195,100%,50%,0.15)',
      }}
    >
      <div className="flex items-center gap-3 text-hud-cyan/80">
        <span className="w-1.5 h-1.5 rounded-full bg-hud-cyan animate-pulse" style={{ boxShadow: '0 0 6px hsl(195 100% 60%)' }} />
        <span>RH·OS v2.4</span>
        <span className="text-white/40">|</span>
        <span>{status}</span>
      </div>
      <div className="flex items-center gap-3 text-hud-cyan/80">
        <span>SIG·{pct}%</span>
        <span className="text-white/40">|</span>
        <span>{fps}FPS</span>
        <span className="text-white/40">|</span>
        <span className="text-hud-cyan">{time}</span>
      </div>
    </div>
  );
}