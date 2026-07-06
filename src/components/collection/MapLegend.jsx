import React from 'react';

export const rarityColor = {
  common: '#a0a0b0',
  uncommon: '#6ee7b7',
  rare: '#7dd3fc',
  legendary: '#c084fc',
};

export default function MapLegend() {
  return (
    <div className="absolute top-3 left-3 glass-panel px-3 py-2 rounded-xl flex flex-col gap-1.5 text-[11px]">
      {Object.entries(rarityColor).map(([r, c]) => (
        <div key={r} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: c }} />
          <span className="text-white/60 capitalize">{r}</span>
        </div>
      ))}
    </div>
  );
}
