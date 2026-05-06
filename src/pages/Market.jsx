import React, { useState } from 'react';
import { Search, Filter, ShoppingBag, TrendingUp } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function Market() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filterChips = [
    { id: 'all', label: 'All' },
    { id: 'minerals', label: 'Minerals' },
    { id: 'crystals', label: 'Crystals' },
    { id: 'specimens', label: 'Specimens' },
    { id: 'verified', label: 'Verified Only' },
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Marketplace</h1>
        <p className="text-white/50 text-sm mt-2">Premium mineral & specimen listings with verified provenance</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text"
            placeholder="Search by mineral name, locality, seller…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amethyst/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wide transition ${
                activeFilter === chip.id
                  ? 'bg-amethyst/20 border border-amethyst/50 text-amethyst-glow'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state — marketplace coming soon */}
      <GlassPanel className="p-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-amethyst/10 border border-amethyst/25">
          <ShoppingBag size={24} className="text-amethyst-glow" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Marketplace Coming Soon</h2>
        <p className="text-white/60 max-w-md mx-auto mb-6">
          Curated premium mineral and specimen listings with verified provenance, secure payments, and collector trust signals.
        </p>
        <div className="space-y-2 text-sm text-white/50 mb-6">
          <div className="flex items-center gap-2 justify-center">
            <TrendingUp size={14} /> Premium listings from verified collectors
          </div>
          <div className="flex items-center gap-2 justify-center">
            <TrendingUp size={14} /> Provenance and authenticity badges
          </div>
          <div className="flex items-center gap-2 justify-center">
            <TrendingUp size={14} /> Draft listings from your collection
          </div>
        </div>
      </GlassPanel>

      {/* Roadmap hint */}
      <div className="mt-8 text-center text-xs text-white/30 uppercase tracking-widest">
        Coming in v2 → Secure Marketplace with Stripe Integration
      </div>
    </div>
  );
}