import React, { useEffect, useState } from 'react';

/**
 * Water-ripple effect that emanates from a tap point.
 * Renders concentric rings expanding outward and fading,
 * like a stone dropped in still water.
 */
export default function WaterRipple({ x, y, onDone }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true);
      onDone?.();
    }, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  if (done) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {[0, 220, 420].map((delay, i) => (
        <span
          key={i}
          className="absolute rounded-full border-2 border-amethyst-glow/70"
          style={{
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            animation: `water-ripple 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}ms forwards`,
            boxShadow:
              '0 0 24px hsla(280,100%,75%,0.6), inset 0 0 12px hsla(195,100%,70%,0.4)',
          }}
        />
      ))}
      <style>{`
        @keyframes water-ripple {
          0%   { width: 0;     height: 0;     opacity: 0.95; border-width: 3px; }
          60%  { opacity: 0.5; border-width: 2px; }
          100% { width: 320px; height: 320px; opacity: 0;   border-width: 1px; }
        }
      `}</style>
    </div>
  );
}