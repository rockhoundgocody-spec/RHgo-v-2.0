import React from 'react';

/**
 * HudGridOverlay — animated cyan grid that overlays the live feed.
 * Suggests a calibrated targeting plane.
 */
export default function HudGridOverlay({ density = 32, opacity = 0.08 }) {
  return (
    <>
      {/* fine grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsla(195,100%,60%,${opacity}) 1px, transparent 1px),
            linear-gradient(90deg, hsla(195,100%,60%,${opacity}) 1px, transparent 1px)
          `,
          backgroundSize: `${density}px ${density}px`,
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
        }}
      />
      {/* coarse grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsla(195,100%,60%,${opacity * 1.5}) 1px, transparent 1px),
            linear-gradient(90deg, hsla(195,100%,60%,${opacity * 1.5}) 1px, transparent 1px)
          `,
          backgroundSize: `${density * 4}px ${density * 4}px`,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      {/* horizon line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsla(195,100%,60%,0.35), transparent)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-px pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent, hsla(195,100%,60%,0.35), transparent)',
        }}
      />
    </>
  );
}