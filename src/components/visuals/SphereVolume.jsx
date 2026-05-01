import React from 'react';

/**
 * Pure CSS volumetric sphere cues — converts a flat disc into a perceived 3D
 * glass orb by stacking:
 *   1. Back-face silhouette (darker far hemisphere seen through the glass)
 *   2. Inner-volume gradient (light scatters toward the front-center)
 *   3. Terminator shading (curvature falloff at the edge)
 *   4. Specular highlight (off-center bright spot — reads as a curved surface)
 *   5. Rim light (back-lit edge glow — depth cue)
 */
export default function SphereVolume() {
  return (
    <>
      {/* 1. BACK-FACE — far hemisphere darkening, offset down-right to imply
            light source from upper-left */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none mix-blend-multiply"
        style={{
          background:
            'radial-gradient(circle at 65% 70%, hsla(265,80%,8%,0.7) 0%, hsla(265,80%,12%,0.45) 30%, transparent 60%)',
        }}
      />

      {/* 2. INNER VOLUME — light pools at front-center, fades to deep edges
            (subsurface-scatter look) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at 38% 35%, hsla(280,100%,75%,0.28) 0%, hsla(270,90%,55%,0.12) 28%, transparent 55%)',
        }}
      />

      {/* 3. TERMINATOR — curvature shading, darkens near the rim everywhere
            equally to imply spherical falloff */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none mix-blend-multiply"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 40%, hsla(240,40%,5%,0.55) 88%, hsla(240,50%,3%,0.85) 100%)',
        }}
      />

      {/* 4. SPECULAR HIGHLIGHT — small, bright, off-center; the strongest
            single cue of a curved glossy surface */}
      <div
        className="absolute rounded-full pointer-events-none mix-blend-screen blur-md"
        style={{
          top: '14%',
          left: '22%',
          width: '32%',
          height: '22%',
          background:
            'radial-gradient(ellipse at center, hsla(280,100%,90%,0.55) 0%, hsla(280,100%,80%,0.25) 40%, transparent 75%)',
        }}
      />

      {/* 5. RIM LIGHT — thin neon back-lit edge, sells volumetric depth */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 76%, hsla(280,100%,65%,0.35) 92%, transparent 100%)',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
}