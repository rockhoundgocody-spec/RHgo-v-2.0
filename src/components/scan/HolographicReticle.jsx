import React, { useEffect, useRef } from 'react';

/**
 * HolographicReticle — animated targeting reticle that pulses, sweeps a
 * scanline, and emits crosshairs. Pure SVG so it sits weightlessly atop
 * the camera feed. `signal` (0..1) drives lock-on intensity.
 */
export default function HolographicReticle({ signal = 0, locked = false, label = 'TRACKING' }) {
  const ringRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    let raf;
    let t = 0;
    const tick = () => {
      t += 0.016;
      if (ringRef.current) {
        ringRef.current.style.transform = `rotate(${t * 18}deg)`;
      }
      if (tickRef.current) {
        const pulse = 0.6 + Math.sin(t * 4) * 0.2 + signal * 0.3;
        tickRef.current.style.opacity = String(pulse);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [signal]);

  const color = locked ? 'hsl(145 90% 60%)' : 'hsl(195 100% 60%)';
  const glow = locked ? 'hsla(145,90%,55%,0.7)' : 'hsla(195,100%,55%,0.55)';
  const size = 240 + signal * 30;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div
        className="relative"
        style={{ width: size, height: size, transition: 'width 0.4s, height 0.4s' }}
      >
        {/* outer rotating bracket ring */}
        <svg
          ref={ringRef}
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
        >
          <g fill="none" stroke={color} strokeWidth="0.4">
            {[0, 90, 180, 270].map((a) => (
              <path
                key={a}
                d={`M 50 50 m -42 0 a 42 42 0 0 1 12 -29`}
                transform={`rotate(${a} 50 50)`}
                strokeLinecap="round"
              />
            ))}
            <circle cx="50" cy="50" r="46" strokeOpacity="0.15" strokeDasharray="0.5 1.5" />
          </g>
        </svg>

        {/* corner brackets — fixed orientation */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full"
             style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
          <g fill="none" stroke={color} strokeWidth="0.6" strokeLinecap="round">
            <path d="M 18 28 L 18 18 L 28 18" />
            <path d="M 72 18 L 82 18 L 82 28" />
            <path d="M 82 72 L 82 82 L 72 82" />
            <path d="M 28 82 L 18 82 L 18 72" />
          </g>
        </svg>

        {/* center crosshair + tick */}
        <svg ref={tickRef} viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <g stroke={color} strokeWidth="0.3" fill="none">
            <line x1="50" y1="38" x2="50" y2="44" />
            <line x1="50" y1="56" x2="50" y2="62" />
            <line x1="38" y1="50" x2="44" y2="50" />
            <line x1="56" y1="50" x2="62" y2="50" />
            <circle cx="50" cy="50" r="1.2" fill={color} />
          </g>
        </svg>

        {/* scanline */}
        {!locked && (
          <div
            aria-hidden
            className="absolute inset-x-6 h-12 animate-hud-scan rounded-sm"
            style={{
              background: `linear-gradient(to bottom, ${glow}, transparent)`,
              top: 0,
            }}
          />
        )}

        {/* label pill */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-7 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-[0.3em]"
          style={{
            color,
            background: 'hsla(220,40%,5%,0.7)',
            border: `1px solid ${color}`,
            boxShadow: `0 0 12px ${glow}`,
          }}
        >
          {locked ? '◉ LOCKED' : `▷ ${label}`}
        </div>
      </div>
    </div>
  );
}