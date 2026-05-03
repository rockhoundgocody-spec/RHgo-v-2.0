import React, { useEffect } from 'react';

/**
 * ProcessingPulse — concentric glowing rings + soft haptic ticks while the
 * AI processes a specimen. Pure decorative overlay; mounts during the
 * reconstruct stage and unmounts when the stage advances.
 */
export default function ProcessingPulse({ active = true, intensity = 1 }) {
  // Subtle haptic tick every ring sweep (~1.6s).
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    const id = setInterval(() => {
      try {
        navigator.vibrate([12, 40, 8]);
      } catch {}
    }, 1600);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: 140,
            height: 140,
            borderColor: 'hsla(280,100%,75%,0.45)',
            boxShadow:
              '0 0 28px hsla(280,100%,60%,0.4), inset 0 0 28px hsla(280,100%,60%,0.25)',
            transform: 'translate(-50%, -50%)',
            animation: `pp-ring 2.4s ease-out ${i * 0.8}s infinite`,
            opacity: 0,
          }}
        />
      ))}

      {/* Hud-cyan secondary echo */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 220,
          height: 220,
          background:
            'radial-gradient(circle, hsla(195,100%,55%,0.18) 0%, transparent 60%)',
          transform: 'translate(-50%, -50%)',
          animation: 'pp-breath 2s ease-in-out infinite',
          opacity: 0.7 * intensity,
        }}
      />

      <style>{`
        @keyframes pp-ring {
          0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.9; }
          70%  { opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes pp-breath {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50%      { transform: translate(-50%, -50%) scale(1.15); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}