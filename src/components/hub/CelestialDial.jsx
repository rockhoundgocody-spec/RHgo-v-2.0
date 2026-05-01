import React from 'react';
import useLunarSolar from './useLunarSolar';

/**
 * CelestialDial — small lunar/solar status indicator near the orb.
 * Shows current moon phase as a clipped disk + sun altitude as an arc.
 */
export default function CelestialDial() {
  const { phase, illumination, isNight, sunAlt } = useLunarSolar();
  const phaseLabel = phaseName(phase);

  // Moon disc — clip half based on phase
  // Waxing (0..0.5): right side lit. Waning (0.5..1): left side lit.
  const waxing = phase < 0.5;
  const litPct = Math.round(illumination * 100);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full glass-panel">
      {/* moon */}
      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/20"
           style={{ background: 'hsla(240,30%,8%,1)' }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at ${waxing ? '70%' : '30%'} 50%, hsla(50,80%,90%,1) 0%, hsla(40,60%,75%,0.85) 60%, transparent 90%)`,
            clipPath: waxing
              ? `inset(0 0 0 ${50 - illumination * 50}%)`
              : `inset(0 ${50 - illumination * 50}% 0 0)`,
          }}
        />
      </div>
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-amethyst/80">
        {phaseLabel} · {litPct}%
      </div>
      <div className="w-px h-3 bg-white/15" />
      {/* sun */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: isNight ? 'hsla(240,40%,20%,1)' : `hsla(${50 - sunAlt * 30}, 90%, ${55 + sunAlt * 20}%, 1)`,
            boxShadow: isNight ? 'none' : `0 0 ${6 + sunAlt * 10}px hsla(40,90%,60%,${0.6 + sunAlt * 0.4})`,
          }}
        />
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-amethyst/80">
          {isNight ? 'Night' : `Sun ${Math.round(sunAlt * 100)}%`}
        </div>
      </div>
    </div>
  );
}

function phaseName(p) {
  if (p < 0.03 || p > 0.97) return 'New';
  if (p < 0.22) return 'Waxing Crescent';
  if (p < 0.28) return 'First Qtr';
  if (p < 0.47) return 'Waxing Gibbous';
  if (p < 0.53) return 'Full';
  if (p < 0.72) return 'Waning Gibbous';
  if (p < 0.78) return 'Last Qtr';
  return 'Waning Crescent';
}