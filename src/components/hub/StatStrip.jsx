import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const stats = [
  { v: '15', l: 'Hotspots' },
  { v: '0', l: 'Specimens' },
  { v: 'LV.1', l: 'Field Rank' },
  { v: '∞', l: 'Possibility' },
];

export default function StatStrip() {
  return (
    <GlassPanel variant="hud">
      <div className="grid grid-cols-4 divide-x divide-hud-cyan/20 text-center py-3">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="text-hud font-mono text-lg sm:text-xl glow-hud">{s.v}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-hud-cyan/60 mt-1">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}