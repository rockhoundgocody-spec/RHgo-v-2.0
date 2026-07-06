import React from 'react';
import { Gem } from 'lucide-react';
import { rarityColor } from './MapLegend';

export default function MapSpecimenCard({ specimen, onClose }) {
  if (!specimen) return null;

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel rounded-2xl p-3 flex items-center gap-3 max-w-[280px] w-[90%] cursor-pointer"
      onClick={onClose}
    >
      {specimen.image_url ? (
        <img
          src={specimen.image_url}
          alt={specimen.mineral_name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-amethyst/20 flex items-center justify-center flex-shrink-0">
          <Gem size={20} className="text-amethyst-glow" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold truncate">{specimen.mineral_name}</div>
        {specimen.found_date && (
          <div className="text-white/40 text-[10px] mt-0.5">{specimen.found_date}</div>
        )}
        <div
          className="text-[9px] uppercase tracking-wider mt-1 font-medium"
          style={{ color: rarityColor[specimen.rarity || 'common'] }}
        >
          {specimen.rarity || 'common'}
        </div>
      </div>
    </div>
  );
}
