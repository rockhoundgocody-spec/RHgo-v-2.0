import React from 'react';
import { MapPin } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { getCollectionLabel, getPublicationLabel } from '@/lib/locationPolicy';

export default function HotspotListItem({ hotspot, active, onClick }) {
  return (
    <GlassPanel
      onClick={onClick}
      className={`cursor-pointer transition-all ${
        active ? 'ring-2 ring-hud-cyan/60 scale-[1.01]' : 'hover:scale-[1.01]'
      }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm truncate">{hotspot.name}</div>
            <div className="text-amethyst/60 text-[11px] flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {hotspot.state || hotspot.country}
            </div>
          </div>
          <div
            className="shrink-0 text-[9px] tracking-widest font-mono px-1.5 py-0.5 rounded border text-emerald-300 border-emerald-400/40 bg-emerald-400/10"
          >
            {getPublicationLabel(hotspot)}
          </div>
        </div>
        {hotspot.minerals?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {hotspot.minerals.slice(0, 3).map((m) => (
              <span
                key={m}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-amethyst/15 text-amethyst-glow border border-amethyst/20"
              >
                {m}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <span className="text-[9px] uppercase tracking-wider text-white/40">
            {hotspot.difficulty}
          </span>
          <span className="text-[9px] text-hud-cyan/70 text-right">{getCollectionLabel(hotspot)}</span>
        </div>
      </div>
    </GlassPanel>
  );
}
