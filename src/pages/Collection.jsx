import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Loader2, GitCompareArrows, Map, LayoutGrid, BarChart2, Images, Sparkles } from 'lucide-react';
import GalleryGrid from '@/components/collection/GalleryGrid.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import CrystalSystemInsights from '@/components/collection/CrystalSystemInsights.jsx';
import CollectionMap from '@/components/collection/CollectionMap.jsx';
import SpecimenCard from '@/components/collection/SpecimenCard.jsx';
import CrystalCard from '@/components/collection/CrystalCard.jsx';
import CollectionDashboard from '@/components/collection/CollectionDashboard.jsx';
import EmptyState from '@/components/visuals/EmptyState.jsx';
import { SkeletonGrid } from '@/components/visuals/SkeletonCard.jsx';
import { useEntityList } from '@/lib/useEntityQuery';
import PullToRefresh from '@/components/nav/PullToRefresh.jsx';

export default function Collection() {
  const { data: specimens = [], isLoading: loading, refetch } = useEntityList('Specimen', '-found_date');
  const [view, setView] = useState('crystal'); // 'crystal' | 'gallery' | 'grid' | 'map' | 'dashboard'

  return (
    <PullToRefresh onRefresh={refetch} className="min-h-screen">
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GeoDex</h1>
          <p className="text-white/35 text-[11px] uppercase tracking-[0.25em] mt-1">Your discovery index</p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-xl glass-panel">
          <button onClick={() => setView('crystal')} className={`p-2 rounded-lg transition ${view === 'crystal' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Crystal view"><Sparkles size={16} /></button>
          <button onClick={() => setView('gallery')} className={`p-2 rounded-lg transition ${view === 'gallery' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Gallery view"><Images size={16} /></button>
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Grid view"><LayoutGrid size={16} /></button>
          <button onClick={() => setView('map')} className={`p-2 rounded-lg transition ${view === 'map' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Map view"><Map size={16} /></button>
          <button onClick={() => setView('dashboard')} className={`p-2 rounded-lg transition ${view === 'dashboard' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Dashboard view"><BarChart2 size={16} /></button>
        </div>
      </div>

      {specimens.length >= 2 && (view === 'grid' || view === 'gallery' || view === 'crystal') && (
        <Link
        to="/compare"
        className="mb-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-amethyst/30 bg-amethyst/8 hover:bg-amethyst/15 text-amethyst-glow text-[11px] uppercase tracking-[0.25em] transition"
        >
          <GitCompareArrows size={14} />
          Compare Specimens
        </Link>
      )}

      {/* Crystal masonry view — default, premium */}
      {view === 'crystal' && (
        loading ? (
          <SkeletonGrid count={6} cols={2} />
        ) : specimens.length === 0 ? (
          <EmptyState icon="💎" title="Your Codex is waiting for its first specimen." body="Every scan etches a new entry. Head to the field and bring something back." ctaLabel="Scan Your First Find" ctaTo="/scan" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {specimens.map((s, i) => <CrystalCard key={s.id} specimen={s} index={i} />)}
          </div>
        )
      )}

      {/* Gallery view */}
      {view === 'gallery' && (
        loading ? (
          <SkeletonGrid count={4} cols={2} />
        ) : specimens.length === 0 ? (
          <EmptyState icon="📷" title="No discoveries etched yet." body="Your gallery is ready — head to the field and scan your first find." ctaLabel="Go to Scan" ctaTo="/scan" />
        ) : (
          <GalleryGrid specimens={specimens} />
        )
      )}

      {/* Map view */}
      {view === 'map' && <CollectionMap specimens={specimens} />}

      {/* Dashboard view */}
      {view === 'dashboard' && <CollectionDashboard specimens={specimens} />}

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
          <EmptyState icon="🔬" title="No specimens yet" body="Use the Scan tab to identify your first find." ctaLabel="Scan Now" ctaTo="/scan" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {specimens.map((s, i) => (
              <SpecimenCard key={s.id} specimen={s} index={i} />
            ))}
          </div>
        )
      )}
    </div>
    </PullToRefresh>
  );
}