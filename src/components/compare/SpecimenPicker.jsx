import React from 'react';
import { X, Gem } from 'lucide-react';

export default function SpecimenPicker({ specimens, excludeIds = [], onPick, onClose }) {
  const list = specimens.filter((s) => !excludeIds.includes(s.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] glass-panel rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-amethyst/80 text-xs uppercase tracking-[0.3em]">
            Select Specimen
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/80"
          >
            <X size={14} />
          </button>
        </div>

        {list.length === 0 ? (
          <div className="p-8 text-center text-white/60 text-sm">No more specimens available.</div>
        ) : (
          <div className="overflow-y-auto p-3 grid grid-cols-3 gap-2">
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => onPick(s)}
                className="text-left rounded-xl overflow-hidden border border-white/10 hover:border-amethyst/60 bg-black/30 transition"
              >
                <div className="aspect-square bg-black/40">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.mineral_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amethyst/30">
                      <Gem size={20} />
                    </div>
                  )}
                </div>
                <div className="p-1.5">
                  <div className="text-white text-[11px] font-medium truncate">
                    {s.mineral_name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}