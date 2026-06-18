import React from 'react';
import { Plus, X, Gem } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const ROWS = [
  { key: 'hardness', label: 'Hardness (Mohs)' },
  { key: 'streak', label: 'Streak' },
  { key: 'crystal_system', label: 'Crystal System' },
];

function SlotCard({ slot, onPick, onClear }) {
  if (!slot) {
    return (
      <button
        onClick={onPick}
        className="w-full aspect-square rounded-2xl border-2 border-dashed border-amethyst/30 bg-amethyst/5 hover:bg-amethyst/10 hover:border-amethyst/60 focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none transition flex flex-col items-center justify-center text-amethyst/70"
      >
        <Plus size={28} />
        <span className="text-[10px] uppercase tracking-[0.2em] mt-2">Select Specimen</span>
      </button>
    );
  }
  const { specimen } = slot;
  return (
    <div className="relative">
      <button
        onClick={onClear}
        className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/60 border border-white/15 text-white/80 hover:text-white focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none flex items-center justify-center"
        aria-label="Remove specimen"
      >
        <X size={12} />
      </button>
      <div className="aspect-square overflow-hidden rounded-2xl border border-amethyst/30 bg-black/40">
        {specimen.image_url ? (
          <img src={specimen.image_url} alt={specimen.mineral_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amethyst/30">
            <Gem size={32} />
          </div>
        )}
      </div>
      <div className="mt-2 text-center">
        <div className="text-white text-sm font-semibold truncate">{specimen.mineral_name}</div>
        {specimen.found_date && (
          <div className="text-[10px] text-white/40 mt-0.5">{specimen.found_date}</div>
        )}
      </div>
    </div>
  );
}

function valueFor(slot, key) {
  if (!slot) return '—';
  const v = slot.mineral?.[key];
  return v && String(v).trim() ? v : '—';
}

export default function CompareTable({ slots, onPickSlot, onClearSlot }) {
  const [a, b] = slots;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SlotCard slot={a} onPick={() => onPickSlot(0)} onClear={() => onClearSlot(0)} />
        <SlotCard slot={b} onPick={() => onPickSlot(1)} onClear={() => onClearSlot(1)} />
      </div>

      <GlassPanel>
        <div className="divide-y divide-white/10">
          {ROWS.map((row) => {
            const va = valueFor(a, row.key);
            const vb = valueFor(b, row.key);
            const match = a && b && va !== '—' && vb !== '—' && String(va).toLowerCase() === String(vb).toLowerCase();
            return (
              <div key={row.key} className="px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst/60 mb-2 flex items-center justify-between">
                  <span>{row.label}</span>
                  {match && (
                    <span className="text-emerald-300/80 normal-case tracking-normal text-[10px]">
                      ● match
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-white text-sm font-medium break-words">{va}</div>
                  <div className="text-white text-sm font-medium break-words">{vb}</div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {(!a || !b) && (
        <p className="text-center text-white/40 text-xs">
          Pick two specimens to see a full side-by-side.
        </p>
      )}
    </div>
  );
}