import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Calendar, Loader2, GitCompareArrows, Map, LayoutGrid } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import CrystalSystemInsights from '@/components/collection/CrystalSystemInsights.jsx';
import ShareSpecimenButton from '@/components/collection/ShareSpecimenButton.jsx';
import CollectionMap from '@/components/collection/CollectionMap.jsx';
import { useEntityList } from '@/lib/useEntityQuery';
import PullToRefresh from '@/components/nav/PullToRefresh.jsx';

const rarityColor = {
  common: 'text-white/60 border-white/15',
  uncommon: 'text-emerald-300 border-emerald-400/30',
  rare: 'text-sky-300 border-sky-400/30',
  legendary: 'text-amethyst-glow border-amethyst/40',
};

export default function Collection() {
  const { data: specimens = [], isLoading: loading, refetch } = useEntityList('Specimen', '-found_date');
  const [view, setView] = useState('grid'); // 'grid' | 'map'

  return (
    <PullToRefresh onRefresh={refetch} className="min-h-screen">
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Collection</h1>
          <p className="text-white/35 text-[11px] uppercase tracking-[0.25em] mt-1">Your finds</p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-xl glass-panel">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('map')}
            className={`p-2 rounded-lg transition ${view === 'map' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`}
            aria-label="Map view"
          >
            <Map size={16} />
          </button>
        </div>
      </div>

      {specimens.length >= 2 && view === 'grid' && (
        <Link
        to="/compare"
        className="mb-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-amethyst/30 bg-amethyst/8 hover:bg-amethyst/15 text-amethyst-glow text-[11px] uppercase tracking-[0.25em] transition"
        >
          <GitCompareArrows size={14} />
          Compare Specimens
        </Link>
      )}

      {/* Map view */}
      {view === 'map' && (
        <CollectionMap specimens={specimens} />
      )}

      {view === 'grid' && (
        <>
          <GlassPanel className="mb-5">
            <div className="grid grid-cols-3 divide-x divide-white/8 text-center py-5">
              <div>
                <div className="text-3xl font-bold text-white tabular-nums">{specimens.length}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1.5">Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white tabular-nums">
                  {new Set(specimens.map((s) => s.mineral_name)).size}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1.5">Unique</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amethyst-glow tabular-nums">
                  {specimens.filter((s) => s.rarity === 'rare' || s.rarity === 'legendary').length}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1.5">Rare+</div>
              </div>
            </div>
          </GlassPanel>
          <CrystalSystemInsights specimens={specimens} />
        </>
      )}

      {view === 'grid' && (
        loading ? (
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
                    <img
                      src={s.image_url}
                      alt={s.mineral_name}
                      loading="lazy"
                      decoding="async"
                      width="200"
                      height="200"
                      className="w-full h-full object-cover"
                    />
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
                  <div className="mt-2 flex justify-end">
                    <ShareSpecimenButton specimen={s} />
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        )
      )}
    </div>
    </PullToRefresh>
  );
}