import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Loader2, GitCompareArrows, Map, LayoutGrid, BarChart2, Images, Sparkles } from 'lucide-react';
import GalleryGrid from '@/components/collection/GalleryGrid.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import CrystalSystemInsights from '@/components/collection/CrystalSystemInsights.jsx';
import CollectionMap from '@/components/collection/CollectionMap.jsx';
import SpecimenCard from '@/components/collection/SpecimenCard.jsx';
import CrystalCard from '@/components/collection/CrystalCard.jsx';
import HolographicVaultView from '@/components/collection/HolographicVaultView.jsx';
import CollectionDashboard from '@/components/collection/CollectionDashboard.jsx';
import EmptyState from '@/components/visuals/EmptyState.jsx';
import { SkeletonGrid } from '@/components/visuals/SkeletonCard.jsx';
import { useEntityList } from '@/lib/useEntityQuery';
import PullToRefresh from '@/components/nav/PullToRefresh.jsx';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { filterOwnedSpecimens } from '@/api/coreLoop';
import CollectionWeightTracker from '@/components/hub/CollectionWeightTracker.jsx';

const RARITY_FILTERS = ['all', 'common', 'uncommon', 'rare', 'legendary'];

export default function Collection() {
  const { data: allSpecimens = [], isLoading: loading, refetch } = useEntityList('Specimen', '-found_date');
  const { data: me } = useCurrentUser();
  const specimens = useMemo(() => filterOwnedSpecimens(allSpecimens, me), [allSpecimens, me]);
  const [view, setView] = useState('crystal'); // 'crystal' | 'gallery' | 'grid' | 'map' | 'dashboard'
  const [rarityFilter, setRarityFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = specimens;
    if (rarityFilter !== 'all') list = list.filter(s => s.rarity === rarityFilter);
    if (verifiedOnly) list = list.filter(s => s.verified || (s.ai_confidence && s.ai_confidence >= 0.8));
    return list;
  }, [specimens, rarityFilter, verifiedOnly]);

  const RARITY_COLORS = { all: 'hsla(270,50%,60%,1)', common: '#94a3b8', uncommon: '#34d399', rare: '#38bdf8', legendary: '#a78bfa' };

  return (
    <PullToRefresh onRefresh={refetch} className="min-h-screen">
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">GeoDex</h1>
          <p className="text-white/35 text-[11px] uppercase tracking-[0.25em] mt-0.5">
            {specimens.length} {specimens.length === 1 ? 'specimen' : 'specimens'} etched
          </p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-xl glass-panel" role="group" aria-label="Collection views">
          <button onClick={() => setView('vault')} aria-pressed={view === 'vault'} className={`p-2 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none ${view === 'vault' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="3D Vault view" title="3D Holographic Vault"><Gem size={16} /></button>
          <button onClick={() => setView('crystal')} aria-pressed={view === 'crystal'} className={`p-2 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none ${view === 'crystal' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Crystal view"><Sparkles size={16} /></button>
          <button onClick={() => setView('gallery')} aria-pressed={view === 'gallery'} className={`p-2 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none ${view === 'gallery' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Gallery view"><Images size={16} /></button>
          <button onClick={() => setView('grid')} aria-pressed={view === 'grid'} className={`p-2 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none ${view === 'grid' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Grid view"><LayoutGrid size={16} /></button>
          <button onClick={() => setView('map')} aria-pressed={view === 'map'} className={`p-2 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none ${view === 'map' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Map view"><Map size={16} /></button>
          <button onClick={() => setView('dashboard')} aria-pressed={view === 'dashboard'} className={`p-2 rounded-lg transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none ${view === 'dashboard' ? 'bg-amethyst/30 text-white' : 'text-amethyst/50 hover:text-amethyst'}`} aria-label="Dashboard view"><BarChart2 size={16} /></button>
        </div>
      </div>

      {me?.email && (
        <div className="mb-4 space-y-2">
          <CollectionWeightTracker userEmail={me.email} />
          <Link
            to="/chronolith"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-amethyst/30 bg-amethyst/8 hover:bg-amethyst/15 text-amethyst-glow text-[11px] uppercase tracking-[0.25em] transition"
          >
            Investigate a specimen
          </Link>
        </div>
      )}

      {/* Rarity + verified filters */}
      {(view === 'crystal' || view === 'grid' || view === 'gallery') && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }} role="group" aria-label="Filters">
            {RARITY_FILTERS.map(r => (
              <button key={r} onClick={() => setRarityFilter(r)}
                aria-pressed={rarityFilter === r}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] transition active:scale-95 focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none"
                style={{
                  background: rarityFilter === r ? `${RARITY_COLORS[r]}20` : 'hsla(245,25%,12%,0.6)',
                  border: `1px solid ${rarityFilter === r ? `${RARITY_COLORS[r]}50` : 'hsla(270,20%,30%,0.2)'}`,
                  color: rarityFilter === r ? RARITY_COLORS[r] : 'hsla(0,0%,100%,0.4)',
                }}>
                {r === 'all' ? `All (${specimens.length})` : r}
              </button>
            ))}
            <button onClick={() => setVerifiedOnly(v => !v)}
              aria-pressed={verifiedOnly}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#34d399] focus-visible:outline-none"
              style={{
                background: verifiedOnly ? 'hsla(160,70%,50%,0.15)' : 'hsla(245,25%,12%,0.6)',
                border: `1px solid ${verifiedOnly ? 'hsla(160,70%,50%,0.4)' : 'hsla(270,20%,30%,0.2)'}`,
                color: verifiedOnly ? '#34d399' : 'hsla(0,0%,100%,0.4)',
              }}>
              ✓ Verified
            </button>
          </div>
        </div>
      )}

      {specimens.length >= 2 && (view === 'grid' || view === 'gallery' || view === 'crystal') && (
        <Link
        to="/compare"
        className="mb-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-amethyst/30 bg-amethyst/8 hover:bg-amethyst/15 text-amethyst-glow text-[11px] uppercase tracking-[0.25em] transition"
        >
          <GitCompareArrows size={14} />
          Compare Specimens
        </Link>
      )}

      {/* 3D Holographic Pedestal Vault view */}
      {view === 'vault' && (
        loading ? (
          <SkeletonGrid count={2} cols={1} />
        ) : specimens.length === 0 ? (
          <EmptyState icon="💎" title="Vault is empty" body="Scan your first rock to place it in your 3D digital collection vault." ctaLabel="Scan Your First Find" ctaTo="/scan" />
        ) : (
          <HolographicVaultView specimens={filtered.length ? filtered : specimens} />
        )
      )}

      {/* Crystal masonry view — default, premium */}
      {view === 'crystal' && (
        loading ? (
          <SkeletonGrid count={6} cols={2} />
        ) : specimens.length === 0 ? (
          <EmptyState icon="💎" title="Your Codex is waiting for its first specimen." body="Every scan etches a new entry. Head to the field and bring something back." ctaLabel="Scan Your First Find" ctaTo="/scan" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="This layer is quiet." body="No specimens match the current filter. Try a different rarity or remove filters." ctaOnClick={() => { setRarityFilter('all'); setVerifiedOnly(false); }} ctaLabel="Clear Filters" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((s, i) => <CrystalCard key={s.id} specimen={s} index={i} />)}
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
          <GalleryGrid specimens={filtered} />
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
            {filtered.map((s, i) => (
              <SpecimenCard key={s.id} specimen={s} index={i} />
            ))}
          </div>
        )
      )}
    </div>
    </PullToRefresh>
  );
}
