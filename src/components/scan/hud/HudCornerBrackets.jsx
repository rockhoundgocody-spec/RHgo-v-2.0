import React from 'react';

/**
 * HudCornerBrackets — large animated corner brackets that frame the
 * entire scanner viewport. Pure SVG, no layout cost.
 */
export default function HudCornerBrackets({ color = 'hsl(195 100% 60%)', size = 56, thickness = 2 }) {
  const glow = 'hsla(195,100%,55%,0.55)';
  const corner = (rot) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rot}deg)`, filter: `drop-shadow(0 0 6px ${glow})` }}
    >
      <path
        d="M 8 30 L 8 8 L 30 8"
        fill="none"
        stroke={color}
        strokeWidth={thickness * 2}
        strokeLinecap="round"
      />
      <line x1="8" y1="42" x2="8" y2="50" stroke={color} strokeWidth={thickness} opacity="0.5" />
      <line x1="42" y1="8" x2="50" y2="8" stroke={color} strokeWidth={thickness} opacity="0.5" />
    </svg>
  );

  return (
    <>
      <div className="absolute top-0 left-0">{corner(0)}</div>
      <div className="absolute top-0 right-0">{corner(90)}</div>
      <div className="absolute bottom-0 right-0">{corner(180)}</div>
      <div className="absolute bottom-0 left-0">{corner(270)}</div>
    </>
  );
}