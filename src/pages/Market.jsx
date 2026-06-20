import React, { useState } from 'react';
import { Search, Filter, Gem, MapPin, Shield, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import EmptyState from '@/components/visuals/EmptyState.jsx';
import { motion } from 'framer-motion';

const RARITY_MOCK = ['common', 'uncommon', 'rare', 'legendary', 'uncommon', 'rare'];
const MINERAL_MOCK = ['Labradorite', 'Petoskey Stone', 'Lake Superior Agate', 'Yooperlite', 'Fluorite', 'Amethyst'];
const RARITY_CFG = {
  common:    { color: '#94a3b8', glow: 'hsla(215,20%,55%,0.3)',  label: 'Common' },
  uncommon:  { color: '#34d399', glow: 'hsla(160,70%,50%,0.35)', label: 'Uncommon' },
  rare:      { color: '#38bdf8', glow: 'hsla(200,90%,60%,0.4)',  label: 'Rare' },
  legendary: { color: '#a78bfa', glow: 'hsla(270,80%,65%,0.5)',  label: 'Legendary' },
};

function ListingCard({ index }) {
  const rarity = RARITY_MOCK[index % RARITY_MOCK.length];
  const rc = RARITY_CFG[rarity];
  const mineral = MINERAL_MOCK[index % MINERAL_MOCK.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: 'linear-gradient(160deg, hsla(255,30%,12%,0.85), hsla(245,25%,7%,0.9))',
        border: `1px solid ${rc.glow.replace(/[\d.]+\)$/, '0.22)')}`,
        boxShadow: `0 4px 20px -8px ${rc.glow}`,
      }}
    >
      {/* Image placeholder */}
      <div className="aspect-square relative overflow-hidden flex items-center justify-center"
        style={{ background: `radial-gradient(circle at 40% 35%, ${rc.glow}, hsla(245,25%,6%,0.8))` }}>
        <Gem size={32} style={{ color: rc.color, opacity: 0.5 }} />
        {/* Rarity badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
            style={{ background: `${rc.glow.replace(/[\d.]+\)$/, '0.25)')}`, color: rc.color, border: `1px solid ${rc.glow.replace(/[\d.]+\)$/, '0.35)')}` }}>
            {rc.label}
          </span>
        </div>
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'hsla(220,40%,5%,0.85)', border: '1px solid hsla(0,0%,100%,0.1)' }}>
          <Shield size={10} className="text-emerald-400" />
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="text-white/90 text-[13px] font-bold truncate mb-0.5">{mineral}</div>
        <div className="flex items-center gap-1 text-white/35 text-[10px] mb-2">
          <MapPin size={9} /> Great Lakes Region · Verified
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black" style={{ color: rc.color }}>Make offer</span>
          <button className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition active:scale-95"
            style={{ background: `${rc.glow.replace(/[\d.]+\)$/, '0.15)')}`, color: rc.color, border: `1px solid ${rc.glow.replace(/[\d.]+\)$/, '0.3)')}` }}>
            View →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Market() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const FILTERS = ['all', 'rare+', 'verified', 'great lakes', 'fossils'];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.35em] text-white/30 mb-1 font-semibold">Field-Collected</div>
        <h1 className="text-2xl font-black text-white tracking-tight">Trade Board</h1>
        <p className="text-white/35 text-[11px] uppercase tracking-[0.2em] mt-0.5">Verified provenance · Collector-to-collector</p>
      </div>

      {/* Search & filter row */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
            <input
              type="text"
              placeholder="Search specimens, minerals, regions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm text-white/90 placeholder-white/30 outline-none"
              style={{ background: 'hsla(245,30%,10%,0.8)', border: '1px solid hsla(270,30%,35%,0.25)', backdropFilter: 'blur(16px)' }}
            />
          </div>
          <button
            onClick={() => setFilterOpen(f => !f)}
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
            <button key={f} onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition active:scale-95"
              style={{
                background: activeFilter === f ? 'hsla(270,60%,30%,0.5)' : 'hsla(245,25%,12%,0.6)',
                border: `1px solid ${activeFilter === f ? 'hsla(280,60%,55%,0.4)' : 'hsla(270,20%,30%,0.2)'}`,
                color: activeFilter === f ? 'hsl(280,100%,85%)' : 'hsla(0,0%,100%,0.4)',
              }}>
              {f}
            </button>
          ))}
        </div>

        {filterOpen && (
          <GlassPanel className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {['Mineral type', 'Location', 'Rarity tier', 'Verified only', 'Great Lakes', 'Field-tested'].map((f) => (
                <label key={f} className="flex items-center gap-2.5 cursor-pointer text-sm text-white/60 hover:text-white/90 transition py-0.5">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/30 accent-amethyst" />
                  {f}
                </label>
              ))}
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Valuation insight banner */}
      <div className="mb-5 rounded-2xl p-3.5 flex items-center gap-3"
        style={{ background: 'hsla(200,70%,12%,0.5)', border: '1px solid hsla(195,90%,55%,0.18)' }}>
        <TrendingUp size={15} className="text-hud-cyan flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-hud-cyan text-[11px] font-bold">One-tap specimen valuation coming soon</div>
          <div className="text-white/35 text-[10px] mt-0.5">Anonymized pricing signals from the collector community — always consent-based.</div>
        </div>
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCard key={i} index={i} />
        ))}
      </div>

      {/* Seller CTA */}
      <div className="rounded-2xl p-5 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsla(200,70%,12%,0.6), hsla(215,60%,8%,0.8))',
          border: '1px solid hsla(195,90%,55%,0.2)',
          boxShadow: '0 4px 24px -8px hsla(195,100%,55%,0.2)',
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 20%, hsla(195,100%,60%,0.08) 0%, transparent 60%)' }} />
        <Sparkles size={20} className="text-hud-cyan mx-auto mb-2" />
        <h3 className="text-base font-black text-white mb-1.5">Ready to list your finds?</h3>
        <p className="text-white/45 text-xs mb-4 max-w-[220px] mx-auto leading-relaxed">
          Create a listing from your collection with verified provenance, field photos, and GPS documentation.
        </p>
        <button className="px-5 py-2.5 rounded-2xl font-bold text-sm transition active:scale-95 flex items-center gap-2 mx-auto"
          style={{ background: 'hsla(195,80%,30%,0.3)', border: '1px solid hsla(195,90%,55%,0.35)', color: 'hsl(195,100%,78%)' }}>
          Create Listing <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}