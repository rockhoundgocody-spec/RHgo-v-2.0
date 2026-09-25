import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mountain, Sparkles, Waves, Atom, MapPin, Search } from 'lucide-react';
import {
  AGATE_GENESIS,
  AGATE_TRACE_COLORS,
  AGATE_OPTICAL,
  AGATE_STRUCTURAL,
  AGATE_VARIETIES,
} from '@/lib/agateData';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';

const RARITY_STYLES = {
  common:    { color: '#94a3b8', bg: 'hsla(210,20%,30%,0.3)',  label: 'Common' },
  uncommon:  { color: '#34d399', bg: 'hsla(150,50%,20%,0.3)',  label: 'Uncommon' },
  rare:      { color: '#38bdf8', bg: 'hsla(200,60%,20%,0.3)',  label: 'Rare' },
  legendary: { color: '#a78bfa', bg: 'hsla(270,50%,20%,0.35)', label: 'Legendary' },
};

export default function AgateGuide() {
  useSeoRobots(true);
  useSeoMeta(
    'Agate Guide — varieties, banding, and where to find them',
    'Field guide to agate varieties, optical traits, regions, and how to tell lookalikes apart with RockHound-GO.',
  );
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');

  const filteredVarieties = AGATE_VARIETIES.filter((v) => {
    const matchesRarity = rarityFilter === 'all' || v.rarity === rarityFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.region.toLowerCase().includes(q) ||
      v.setting.toLowerCase().includes(q) ||
      v.characteristics.toLowerCase().includes(q) ||
      v.age.toLowerCase().includes(q);
    return matchesRarity && matchesSearch;
  });

  return (
    <div className="min-h-full pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, hsla(280,60%,30%,0.6) 0%, hsla(255,40%,18%,0.8) 50%, hsla(245,30%,12%,0.9) 100%)',
          }}
        />
        <div className="relative px-5 pt-12 pb-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amethyst-glow" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-amethyst/70">
                Mineralogical Reference
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              The Agate Treatise
            </h1>
            <p className="text-white/55 text-sm mt-2 max-w-xl leading-relaxed">
              Genesis, crystallography, inclusion geochemistry, and global taxonomy of the
              world's most visually diverse cryptocrystalline quartz.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Genesis */}
      <Section icon={<Mountain size={14} />} title="Geochemical Genesis">
        <p className="text-white/65 text-sm leading-relaxed">{AGATE_GENESIS}</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AGATE_TRACE_COLORS.map((tc) => (
            <div
              key={tc.element}
              className="rounded-xl p-3"
              style={{ background: 'hsla(270,30%,15%,0.4)', border: '1px solid hsla(270,40%,30%,0.3)' }}
            >
              <div className="text-[11px] font-bold text-amethyst-glow">{tc.element}</div>
              <div className="text-[11px] text-white/50 mt-0.5">{tc.colors}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Optical Physics */}
      <Section icon={<Atom size={14} />} title="Crystallography & Optical Physics">
        <p className="text-white/55 text-xs leading-relaxed mb-4">
          Agate is an aggregate of fibrous α-quartz crystallites interwoven with moganite (SiO₂).
          Sub-micrometer inclusions, iron oxide nanoparticles, and periodic micro-layering produce
          three principal optical phenomena:
        </p>
        <div className="space-y-3">
          {AGATE_OPTICAL.map((opt) => (
            <div
              key={opt.name}
              className="rounded-xl p-4"
              style={{ background: 'hsla(215,50%,15%,0.35)', border: '1px solid hsla(195,60%,40%,0.25)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-hud">{opt.name}</span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-hud/10 text-hud/70">
                  {opt.mechanism}
                </span>
              </div>
              <p className="text-white/55 text-xs leading-relaxed">{opt.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Structural Morphologies */}
      <Section icon={<Waves size={14} />} title="Inclusion Mineralogy & Structural Morphologies">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AGATE_STRUCTURAL.map((s) => (
            <div
              key={s.category}
              className="rounded-xl p-3.5"
              style={{ background: 'hsla(270,30%,14%,0.4)', border: '1px solid hsla(270,35%,28%,0.25)' }}
            >
              <div className="text-sm font-bold text-white mb-1">{s.category}</div>
              <div className="text-[10px] text-amethyst/60 mb-1.5">{s.inclusion}</div>
              <p className="text-[11px] text-white/50 leading-relaxed mb-2">{s.features}</p>
              <div className="flex flex-wrap gap-1">
                {s.localities.map((l) => (
                  <span
                    key={l}
                    className="text-[9px] px-1.5 py-0.5 rounded-md text-white/45"
                    style={{ background: 'hsla(255,30%,10%,0.5)' }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Global Taxonomy */}
      <Section icon={<MapPin size={14} />} title="Global Geographic Taxonomy">
        {/* Field search + rarity filter */}
        <div className="sticky top-2 z-20 mb-4 space-y-2.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, region, color, or age…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
              style={{
                background: 'hsla(255,30%,12%,0.85)',
                border: '1px solid hsla(270,40%,35%,0.3)',
                backdropFilter: 'blur(12px)',
              }}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {['all', 'common', 'uncommon', 'rare', 'legendary'].map((r) => {
              const rs = r === 'all' ? null : RARITY_STYLES[r];
              const active = rarityFilter === r;
              return (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  aria-pressed={active}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none"
                  style={{
                    background: active
                      ? rs ? rs.bg : 'hsla(280,50%,30%,0.5)'
                      : 'hsla(255,30%,10%,0.5)',
                    color: active ? (rs ? rs.color : 'hsl(280 100% 90%)') : 'hsla(0,0%,100%,0.35)',
                    border: `1px solid ${active ? (rs ? rs.color : 'hsl(280 80% 70%)') + '44' : 'hsla(0,0%,100%,0.08)'}`,
                  }}
                >
                  {r === 'all' ? 'All' : rs?.label || r}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-white/30">
            {filteredVarieties.length} {filteredVarieties.length === 1 ? 'variety' : 'varieties'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVarieties.map((v, i) => {
            const rs = RARITY_STYLES[v.rarity] || RARITY_STYLES.common;
            return (
              <motion.button
                key={v.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(v)}
                className="text-left rounded-2xl overflow-hidden group focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none"
                style={{
                  background: 'hsla(270,25%,14%,0.5)',
                  border: '1px solid hsla(270,30%,30%,0.2)',
                }}
              >
                {/* Image */}
                <div className="relative h-32 overflow-hidden flex items-center justify-center bg-purple-950/40">
                  <span className="text-3xl select-none opacity-30">💎</span>
                  <img
                    src={v.image_url}
                    alt={v.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, hsla(255,30%,12%,0.95) 0%, hsla(255,30%,12%,0.2) 60%, transparent 100%)',
                    }}
                  />
                  <div
                    className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.color}44` }}
                  >
                    {rs.label}
                  </div>
                </div>
                {/* Content */}
                <div className="p-3">
                  <div className="text-sm font-bold text-white leading-tight">{v.name}</div>
                  <div className="text-[10px] text-amethyst/50 uppercase tracking-wider mt-0.5">{v.region}</div>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/35">
                    <span className="truncate">{v.age}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {filteredVarieties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={32} className="text-white/15 mb-3" />
            <p className="text-white/40 text-sm font-semibold">No varieties match your search</p>
            <p className="text-white/25 text-xs mt-1">Try a different name or clear the filters</p>
          </div>
        )}
      </Section>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] overflow-y-auto"
            style={{ background: 'hsla(255,30%,14%,0.97)', border: '1px solid hsla(270,40%,40%,0.3)' }}
          >
            <div className="relative h-48 overflow-hidden flex items-center justify-center bg-purple-950/40">
              <span className="text-4xl select-none opacity-30">💎</span>
              <img
                src={selected.image_url}
                alt={selected.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, hsla(255,30%,14%,0.98) 0%, hsla(255,30%,14%,0.2) 50%, transparent 100%)',
                }}
              />
              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                style={{ background: 'hsla(0,0%,0%,0.4)' }}
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: RARITY_STYLES[selected.rarity].bg,
                    color: RARITY_STYLES[selected.rarity].color,
                    border: `1px solid ${RARITY_STYLES[selected.rarity].color}44`,
                  }}
                >
                  {RARITY_STYLES[selected.rarity].label}
                </span>
                <span className="text-[10px] text-amethyst/50 uppercase tracking-wider">{selected.region}</span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight">{selected.name}</h2>
              <div className="mt-4 space-y-3">
                <DetailRow label="Geological Age" value={selected.age} />
                <DetailRow label="Formation & Setting" value={selected.setting} />
              </div>
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-wider text-amethyst/60 mb-1.5">
                  Mineralogical & Visual Characteristics
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{selected.characteristics}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="px-5 py-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-amethyst-glow"
          style={{ background: 'hsla(280,40%,25%,0.4)', border: '1px solid hsla(280,50%,40%,0.3)' }}>
          {icon}
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-amethyst/60 mb-0.5">{label}</div>
      <div className="text-white/60 text-sm leading-relaxed">{value}</div>
    </div>
  );
}