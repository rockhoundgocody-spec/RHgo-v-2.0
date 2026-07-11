import React from 'react';
import { Droplets, Sun } from 'lucide-react';

/**
 * Wet/Dry toggle — user flips before scan to give AI context on specimen condition.
 */
export default function WetDryToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl overflow-hidden"
      style={{
        background: 'hsla(265,40%,6%,0.8)',
        border: '1px solid hsla(280,40%,40%,0.25)',
        padding: '3px',
      }}>
      <button
        onClick={() => onChange('wet')}
        aria-label="Set condition to wet"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.18em] transition-all focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:outline-none"
        style={{
          background: value === 'wet'
            ? 'linear-gradient(135deg, hsla(200,90%,40%,0.8), hsla(195,100%,35%,0.7))'
            : 'transparent',
          color: value === 'wet' ? 'hsl(195,100%,80%)' : 'hsla(0,0%,100%,0.35)',
          border: value === 'wet' ? '1px solid hsla(195,100%,60%,0.4)' : '1px solid transparent',
          boxShadow: value === 'wet' ? '0 0 12px hsla(195,100%,50%,0.25)' : 'none',
        }}
      >
        <Droplets size={12} />
        Wet
      </button>
      <button
        onClick={() => onChange('dry')}
        aria-label="Set condition to dry"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.18em] transition-all focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-none"
        style={{
          background: value === 'dry'
            ? 'linear-gradient(135deg, hsla(35,90%,50%,0.7), hsla(40,100%,45%,0.6))'
            : 'transparent',
          color: value === 'dry' ? 'hsl(40,100%,78%)' : 'hsla(0,0%,100%,0.35)',
          border: value === 'dry' ? '1px solid hsla(40,100%,60%,0.4)' : '1px solid transparent',
          boxShadow: value === 'dry' ? '0 0 12px hsla(40,100%,50%,0.2)' : 'none',
        }}
      >
        <Sun size={12} />
        Dry
      </button>
    </div>
  );
}