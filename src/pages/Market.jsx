import React, { useState } from 'react';
import { Search, Filter, TrendingUp } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function Market() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Marketplace</h1>
        <p className="text-white/50 text-sm mt-2">Field-collected specimens. Verified provenance. Trusted community.</p>
      </div>

      {/* Search & filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-white/40" />
            <input
              type="text"
              placeholder="Search specimens, minerals, locations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-amethyst/50"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="px-4 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition flex items-center gap-2"
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {filterOpen && (
          <GlassPanel className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Mineral', 'Location', 'Rarity', 'Price'].map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer text-sm text-white/60 hover:text-white">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/30" />
                  {f}
                </label>
              ))}
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <GlassPanel key={i} className="p-4 flex flex-col">
            <div className="aspect-square rounded-lg bg-white/5 border border-white/10 mb-3 flex items-center justify-center">
              <TrendingUp size={24} className="text-amethyst/40" />
            </div>
            <div className="text-sm font-bold text-white mb-1">Specimen #{i}</div>
            <div className="text-xs text-white/50 mb-2">Location · Verified</div>
            <div className="text-xs text-white/40 flex-1 mb-3">Field-collected mineral specimen in excellent condition.</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amethyst-glow">$pending</span>
              <button className="px-3 py-1.5 rounded-lg bg-amethyst-deep/40 border border-amethyst/30 text-amethyst text-xs font-semibold hover:bg-amethyst-deep/60 transition">
                View
              </button>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* CTA for sellers */}
      <GlassPanel variant="hud" className="p-6 text-center">
        <h3 className="text-lg font-bold text-hud-cyan mb-2">Ready to list your finds?</h3>
        <p className="text-white/50 text-sm mb-4">Create a listing from your collection with verified provenance and field documentation.</p>
        <button className="px-6 py-3 rounded-xl bg-hud-cyan/20 border border-hud-cyan/40 text-hud-cyan font-semibold hover:bg-hud-cyan/30 transition">
          Create Listing
        </button>
      </GlassPanel>
    </div>
  );
}