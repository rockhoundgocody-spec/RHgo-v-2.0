import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Loader2, ArrowRightLeft } from 'lucide-react';
import EmptyState from '@/components/visuals/EmptyState.jsx';
import ListingCard from '@/components/market/ListingCard.jsx';
import CreateListingSheet from '@/components/market/CreateListingSheet.jsx';
import HeatMapBanner from '@/components/market/HeatMapBanner.jsx';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const FILTERS = [
  { key: 'all', label: 'All', query: {} },
  { key: 'rare+', label: 'Rare+', query: {} },
  { key: 'verified', label: 'Verified', query: { verified: true } },
  { key: 'trade', label: 'Trade', query: { trade_only: true } },
];

export default function Market() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    base44.entities.MarketListing.list('-created_date', 100)
      .then(l => setListings(l || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [createOpen]);

  const activeFilterCfg = FILTERS.find(f => f.key === activeFilter) || FILTERS[0];

  const filtered = listings.filter(l => {
    if (l.status !== 'active') return false;
    if (activeFilter === 'rare+' && !['rare', 'legendary'].includes(l.rarity)) return false;
    if (activeFilter === 'verified' && !l.verified) return false;
    if (activeFilter === 'trade' && !l.trade_only) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.mineral_name?.toLowerCase().includes(q) && !l.title?.toLowerCase().includes(q) && !l.location_label?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.35em] text-white/30 mb-1 font-semibold">Field-Collected</div>
        <h1 className="text-2xl font-black text-white tracking-tight">Trade Board</h1>
        <p className="text-white/35 text-[11px] uppercase tracking-[0.2em] mt-0.5">Verified provenance · Collector-to-collector</p>
      </div>

      {/* Heat map */}
      <HeatMapBanner />

      {/* Search & filter row */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
            <input type="text" placeholder="Search specimens, minerals, regions…"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm text-white/90 placeholder-white/30 outline-none"
              style={{ background: 'hsla(245,30%,10%,0.8)', border: '1px solid hsla(270,30%,35%,0.25)', backdropFilter: 'blur(16px)' }} />
          </div>
          <button onClick={() => setFilterOpen(f => !f)}
            className="px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-sm transition active:scale-95"
            style={{
              background: filterOpen ? 'hsla(270,60%,30%,0.4)' : 'hsla(245,30%,10%,0.8)',
              border: `1px solid ${filterOpen ? 'hsla(280,60%,55%,0.35)' : 'hsla(270,30%,35%,0.25)'}`,
              color: filterOpen ? 'hsl(280,100%,85%)' : 'hsla(0,0%,100%,0.5)',
            }}>
            <Filter size={14} /> Filters
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              aria-pressed={activeFilter === f.key}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition active:scale-95"
              style={{
                background: activeFilter === f.key ? 'hsla(270,60%,30%,0.5)' : 'hsla(245,25%,12%,0.6)',
                border: `1px solid ${activeFilter === f.key ? 'hsla(280,60%,55%,0.4)' : 'hsla(270,20%,30%,0.2)'}`,
                color: activeFilter === f.key ? 'hsl(280,100%,85%)' : 'hsla(0,0%,100%,0.4)',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="text-amethyst/40 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12">
          <EmptyState icon={ArrowRightLeft} title="No listings yet" description="Be the first to list a specimen for trade." />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {filtered.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
        </div>
      )}

      {/* Floating create button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setCreateOpen(true)}
        className="fixed right-4 bottom-44 z-40 flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm"
        style={{
          background: 'linear-gradient(135deg, hsla(270,60%,35%,0.8), hsla(195,70%,30%,0.7))',
          border: '1px solid hsla(270,60%,55%,0.4)',
          boxShadow: '0 8px 32px hsla(265,80%,30%,0.45)',
          backdropFilter: 'blur(20px)',
          color: 'hsl(280,100%,90%)',
        }}
      >
        <Plus size={18} /> List
      </motion.button>

      <CreateListingSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => {}} />
    </div>
  );
}