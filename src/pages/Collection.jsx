import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Gem, Calendar, Loader2, GitCompareArrows } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const rarityColor = {
  common: 'text-white/60 border-white/15',
  uncommon: 'text-emerald-300 border-emerald-400/30',
  rare: 'text-sky-300 border-sky-400/30',
  legendary: 'text-amethyst-glow border-amethyst/40',
};

export default function Collection() {
  const [specimens, setSpecimens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Specimen.list('-found_date').then((d) => {
      setSpecimens(d || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Collection</h1>
        <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">
          Your finds
        </p>
      </div>

      {specimens.length >= 2 && (
        <Link
          to="/compare"
          className="mb-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-amethyst/40 bg-amethyst/10 hover:bg-amethyst/20 text-amethyst-glow text-xs uppercase tracking-[0.3em] transition"
        >
          <GitCompareArrows size={14} />
          Compare Specimens
        </Link>
      )}

      <GlassPanel className="mb-6">
        <div className="grid grid-cols-3 divide-x divide-white/10 text-center py-4">
          <div>
            <div className="text-2xl font-bold text-white glow-amethyst">{specimens.length}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amethyst/60 mt-1">
              Total
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {new Set(specimens.map((s) => s.mineral_name)).size}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amethyst/60 mt-1">
              Unique
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amethyst-glow">
              {specimens.filter((s) => s.rarity === 'rare' || s.rarity === 'legendary').length}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amethyst/60 mt-1">
              Rare+
            </div>
          </div>
        </div>
      </GlassPanel>

      {loading ? (
        <div className="flex justify-center py-12 text-amethyst/60">
          <Loader2 className="animate-spin" />
        </div>
      ) : specimens.length === 0 ? (
        <GlassPanel className="p-10 text-center">
          <Gem className="mx-auto text-amethyst/40 mb-3" size={40} />
          <p className="text-white/70">No specimens yet.</p>
          <p className="text-white/40 text-xs mt-2">Use the Scan tab to identify your first find.</p>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {specimens.map((s) => (
            <GlassPanel key={s.id}>
              <div className="aspect-square overflow-hidden rounded-t-2xl bg-black/30">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.mineral_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amethyst/30">
                    <Gem size={32} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-white text-sm font-semibold truncate">{s.mineral_name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-white/50 flex items-center gap-1">
                    <Calendar size={10} />
                    {s.found_date || '—'}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      rarityColor[s.rarity || 'common']
                    }`}
                  >
                    {s.rarity || 'common'}
                  </span>
                </div>
                {s.ai_confidence && (
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amethyst"
                      style={{ width: `${(s.ai_confidence * 100).toFixed(0)}%` }}
                    />
                  </div>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}