/**
 * EarnedBadgeMapPin — Glowing badge indicator for map pins
 * Attach to hotspot markers to show if the user has earned a badge there.
 */
import React from 'react';
import LiquidMineralBadge from './LiquidMineralBadge.jsx';
import { COLOR_SCHEMES } from './LiquidMineralBadge.jsx';

export default function EarnedBadgeMapPin({ badge, size = 36 }) {
  if (!badge) return null;
  const scheme = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size + 12, height: size + 12 }}
    >
      {/* Outer pulse ring */}
      <div
        className="absolute rounded-full"
        style={{
          inset: -4,
          background: `radial-gradient(circle, ${scheme.glow.replace('0.9','0.35')} 0%, transparent 70%)`,
          animation: 'map-pin-pulse 2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes map-pin-pulse {
          0%,100%{opacity:.4;transform:scale(1)}
          50%{opacity:.85;transform:scale(1.12)}
        }
      `}</style>
      <LiquidMineralBadge badge={badge} size={size} locked={false} />
    </div>
  );
}