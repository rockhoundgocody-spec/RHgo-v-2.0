/**
 * MapFilterSheet — clean bottom-sheet filter triggered by the funnel button.
 * Sections: ACCESS (radio) · SPOTS (radio) · POPULAR ROCKS (multi-select + search).
 * Dark theme, mint accent, organized like the competitor but on-brand.
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Plus, MessageCircle } from 'lucide-react';

const ACCESS_OPTIONS = [
  { id: 'all',    label: 'All access' },
  { id: 'public', label: 'Public land' },
  { id: 'land',   label: 'Fee / Permit' },
];

const SPOT_OPTIONS = [
  { id: 'rare', label: 'Rare only',      sublabel: 'Tourmaline, topaz, sapphire\u2026' },
  { id: 'gaps', label: 'Collection gaps', sublabel: 'Minerals you haven\u2019t found' },
  { id: 'mine', label: 'My finds',        sublabel: 'Where your collection comes from' },
];

export default function MapFilterSheet({
  open, onClose,
  activeLayer, onLayerChange,
  selectedMinerals, onToggleMineral, onClearMinerals,
  minerals = [],
}) {
  const [search, setSearch] = useState('');

  const filteredMinerals = useMemo(() => {
    if (!search.trim()) return minerals;
    const q = search.toLowerCase();
    return minerals.filter(m => m.toLowerCase().includes(q));
  }, [minerals, search]);

  const activeCount = (activeLayer !== 'all' ? 1 : 0) + selectedMinerals.size;
  const subtitle = activeCount === 0 ? 'No active filters' : `${activeCount} active`;

  const resetAll = () => {
    onLayerChange('all');
    onClearMinerals();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[2000]"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-filter-sheet-title"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 inset-x-0 z-[2001] rounded-t-3xl flex flex-col"
            style={{
              background: '#0a0a14',
              border: '1px solid hsla(270,30%,40%,0.2)',
              borderBottom: 'none',
              maxHeight: '85vh',
            }}
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-3" style={{ borderBottom: '1px solid hsla(255,30%,20%,0.3)' }}>
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-white/15" aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="map-filter-sheet-title" className="text-white font-bold text-base">Map filters</h2>
                  <p className="text-white/40 text-xs">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAll}
                      aria-label="Reset all filters"
                      className="px-3 py-2 rounded-full text-[11px] font-semibold text-white/50 hover:text-white/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close filters"
                    className="px-5 py-2 rounded-full font-bold text-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]"
                    style={{ background: '#9FE8D0', color: '#0a0a14' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl focus-within:ring-2 focus-within:ring-[#9FE8D0]"
                style={{ background: 'hsla(255,30%,12%,0.8)', border: '1px solid hsla(255,30%,25%,0.3)' }}>
                <Search size={16} className="text-white/30" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search rocks"
                  aria-label="Search rocks"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="text-white/30 hover:text-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0] rounded"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none' }}>
              {/* ACCESS */}
              <FilterSection title="ACCESS">
                {ACCESS_OPTIONS.map(opt => (
                  <FilterRadioRow
                    key={opt.id}
                    label={opt.label}
                    active={activeLayer === opt.id}
                    onClick={() => onLayerChange(opt.id)}
                  />
                ))}
              </FilterSection>

              {/* SPOTS */}
              <FilterSection title="SPOTS">
                {SPOT_OPTIONS.map(opt => (
                  <FilterRadioRow
                    key={opt.id}
                    label={opt.label}
                    sublabel={opt.sublabel}
                    active={activeLayer === opt.id}
                    onClick={() => onLayerChange(opt.id)}
                  />
                ))}
              </FilterSection>

              {/* POPULAR ROCKS */}
              <FilterSection title="POPULAR ROCKS">
                {selectedMinerals.size > 0 && (
                  <button
                    type="button"
                    onClick={onClearMinerals}
                    aria-label={`Clear all ${selectedMinerals.size} selected minerals`}
                    className="text-[11px] text-[#9FE8D0] mb-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0] rounded"
                  >
                    Clear all ({selectedMinerals.size})
                  </button>
                )}
                <div className="space-y-1.5">
                  {filteredMinerals.map(mineral => {
                    const active = selectedMinerals.has(mineral);
                    return (
                      <button
                        type="button"
                        key={mineral}
                        onClick={() => onToggleMineral(mineral)}
                        aria-pressed={active}
                        aria-label={`Filter by ${mineral}`}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]"
                        style={{
                          background: active ? 'hsla(160,50%,20%,0.3)' : 'hsla(255,30%,12%,0.5)',
                          border: active ? '1px solid hsla(160,60%,50%,0.4)' : '1px solid hsla(255,30%,20%,0.2)',
                        }}
                      >
                        <span className="text-white text-sm capitalize">{mineral}</span>
                        {active ? (
                          <Check size={16} style={{ color: '#9FE8D0' }} aria-hidden="true" />
                        ) : (
                          <Plus size={16} className="text-white/30" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                  {filteredMinerals.length === 0 && (
                    <p className="text-white/30 text-sm text-center py-4">
                      No minerals match &ldquo;{search}&rdquo;
                    </p>
                  )}
                </div>
              </FilterSection>

              {/* Feedback */}
              <div className="flex items-center justify-center gap-1.5 pt-4 pb-2 text-white/30 text-xs">
                <MessageCircle size={12} aria-hidden="true" />
                <span>How can we improve map filters?</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterRadioRow({ label, sublabel, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}${sublabel ? `, ${sublabel}` : ''}`}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]"
      style={{
        background: active ? 'hsla(160,50%,20%,0.3)' : 'hsla(255,30%,12%,0.5)',
        border: active ? '1px solid hsla(160,60%,50%,0.4)' : '1px solid hsla(255,30%,20%,0.2)',
      }}
    >
      <div className="text-left">
        <div className="text-white text-sm">{label}</div>
        {sublabel && <div className="text-white/35 text-[11px] mt-0.5">{sublabel}</div>}
      </div>
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition"
        style={{
          borderColor: active ? '#9FE8D0' : 'hsla(255,30%,40%,0.4)',
          background: active ? '#9FE8D0' : 'transparent',
        }}
        aria-hidden="true"
      >
        {active && <div className="w-2 h-2 rounded-full" style={{ background: '#0a0a14' }} />}
      </div>
    </button>
  );
}
