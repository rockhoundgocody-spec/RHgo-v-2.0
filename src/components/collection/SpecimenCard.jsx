import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronDown, ChevronUp, Gem } from 'lucide-react';
import ShareSpecimenButton from './ShareSpecimenButton.jsx';

const RARITY_CONFIG = {
  common:    { label: 'Common',    color: '#94a3b8', glow: 'hsla(215,20%,55%,0.4)',  border: 'border-white/10',  bg: 'bg-white/5'   },
  uncommon:  { label: 'Uncommon',  color: '#34d399', glow: 'hsla(160,80%,50%,0.45)', border: 'border-emerald-400/25', bg: 'bg-emerald-900/10' },
  rare:      { label: 'Rare',      color: '#38bdf8', glow: 'hsla(200,90%,60%,0.5)',  border: 'border-sky-400/30', bg: 'bg-sky-900/10' },
  legendary: { label: 'Legendary', color: '#a78bfa', glow: 'hsla(270,80%,65%,0.6)', border: 'border-amethyst/40', bg: 'bg-amethyst-deep/20' },
};

// Specimen evolution: Unknown → Identified → Verified → Documented → Museum Grade
function getEvolutionLevel(specimen) {
  if (!specimen.mineral_name || specimen.mineral_name === 'Unknown') return 0;
  if (!specimen.ai_confidence) return 1;
  if (specimen.verified) return 4;
  if (specimen.notes && specimen.ai_confidence > 0.8) return 3;
  if (specimen.ai_confidence > 0.5) return 2;
  return 1;
}

const EVOLUTION_LABELS = ['Unknown', 'Identified', 'Verified', 'Documented', 'Museum Grade'];
const EVOLUTION_COLORS = ['text-white/30', 'text-white/60', 'text-sky-400', 'text-emerald-400', 'text-amethyst-glow'];

// Pseudo-lore from available data
function buildLore(specimen) {
  const age = specimen.mineral_name?.toLowerCase().includes('quartz') ? '2.5 billion' :
              specimen.mineral_name?.toLowerCase().includes('flint') ? '70 million' :
              specimen.mineral_name?.toLowerCase().includes('obsidian') ? '10,000' : '280 million';
  const loc = specimen.found_at || (specimen.lat ? `${specimen.lat.toFixed(2)}°N` : 'an unknown location');
  return `Formed approximately ${age} years ago. Discovered at ${loc}. Each specimen carries the geological memory of its formation environment.`;
}

export default function SpecimenCard({ specimen, index }) {
  const [expanded, setExpanded] = useState(false);
  const rarity = RARITY_CONFIG[specimen.rarity] || RARITY_CONFIG.common;
  const evoLevel = getEvolutionLevel(specimen);
  const evoLabel = EVOLUTION_LABELS[evoLevel];
  const evoColor = EVOLUTION_COLORS[evoLevel];
  const specNum = String(index + 1).padStart(3, '0');
  const conf = specimen.ai_confidence;
  const purity = conf ? (conf * 100).toFixed(0) : null;
  // Honest confidence label — never over-state certainty
  const confLabel = conf == null ? null
    : conf >= 0.88 ? 'Near certain'
    : conf >= 0.72 ? 'High confidence'
    : conf >= 0.52 ? 'Moderate'
    : 'Needs field test';
  const confColor = conf == null ? '#94a3b8'
    : conf >= 0.88 ? '#34d399'
    : conf >= 0.72 ? '#38bdf8'
    : conf >= 0.52 ? '#fbbf24'
    : '#f87171';
  const collectionScore = conf
    ? ((conf * 0.7 + (evoLevel / 4) * 0.3) * 5).toFixed(1)
    : '—';

  return (
    <Link
      to={`/specimen/${specimen.id}`}
      className={`relative rounded-2xl overflow-hidden border ${rarity.border} ${rarity.bg} transition-all duration-200 active:scale-[0.97] block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
      style={{ boxShadow: `0 0 24px -8px ${rarity.glow}` }}
    >
      {/* Card header strip */}
      <div
        className="absolute top-0 inset-x-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)` }}
      />

      {/* Specimen number badge */}
      <div className="absolute top-2 left-2 text-[9px] font-mono tracking-[0.3em] px-1.5 py-0.5 rounded"
        style={{ background: 'hsla(220,40%,5%,0.8)', color: rarity.color, border: `1px solid ${rarity.color}40` }}>
        #{specNum}
      </div>

      {/* Rarity badge */}
      <div className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-[0.25em] px-1.5 py-0.5 rounded"
        style={{ background: 'hsla(220,40%,5%,0.85)', color: rarity.color }}>
        {rarity.label}
      </div>

      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-black/40 relative">
        {specimen.image_url ? (
          <img src={specimen.image_url} alt={specimen.mineral_name}
            className="w-full h-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gem size={36} style={{ color: rarity.color, opacity: 0.4 }} />
          </div>
        )}
        {/* Holographic wash */}
        <div className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${rarity.glow} 0%, transparent 65%)` }} />
      </div>

      {/* Core data */}
      <div className="p-3 space-y-2">
        <div>
          <div className="text-white font-bold text-sm leading-tight">{specimen.mineral_name}</div>
          {specimen.common_name && specimen.common_name !== specimen.mineral_name && (
            <div className="text-white/40 text-[10px]">{specimen.common_name}</div>
          )}
        </div>

        {/* Evolution bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${evoColor}`}>{evoLabel}</span>
            <span className="text-[9px] text-white/30">Lvl {evoLevel}/4</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(evoLevel / 4) * 100}%`, background: rarity.color }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 text-center gap-1">
          <StatCell label="AI ID" value={purity ? `${purity}%` : '—'} color={confColor} />
          <StatCell label="Score" value={collectionScore !== '—' ? `${collectionScore}★` : '—'} color={rarity.color} />
          <StatCell label="Stage" value={evoLabel.split(' ')[0]} color={rarity.color} />
        </div>
        {/* Honest confidence label */}
        {confLabel && (
          <div className="text-[9px] font-semibold px-2 py-0.5 rounded-full w-fit"
            style={{ background: `${confColor}12`, color: confColor, border: `1px solid ${confColor}30` }}>
            {confLabel}
          </div>
        )}

        {/* Date + location mini row */}
        <div className="flex items-center gap-3 text-[9px] text-white/35">
          {specimen.found_date && (
            <span className="flex items-center gap-1">
              <Calendar size={8} />
              {specimen.found_date}
            </span>
          )}
          {specimen.found_at && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={8} />
              {specimen.found_at}
            </span>
          )}
        </div>

        {/* Share + Expand row — always visible */}
        <div className="flex items-center gap-2">
          <ShareSpecimenButton specimen={specimen} className="flex-1" />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded((v) => !v); }}
            aria-expanded={expanded}
            className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-white/25 hover:text-white/50 transition py-1.5 px-2 rounded-lg border border-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {expanded ? <><ChevronUp size={10} /> Less</> : <><ChevronDown size={10} /> Lore</>}
          </button>
        </div>

        {expanded && (
          <div className="space-y-2 border-t border-white/5 pt-2">
            <p className="text-[10px] text-white/50 leading-relaxed italic">
              {buildLore(specimen)}
            </p>
            {specimen.notes && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Field Notes</div>
                <p className="text-[10px] text-white/60 leading-relaxed">{specimen.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function StatCell({ label, value, color }) {
  return (
    <div className="rounded px-1 py-1.5" style={{ background: 'hsla(220,40%,8%,0.6)' }}>
      <div className="text-[10px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[8px] uppercase tracking-[0.2em] text-white/30 mt-0.5">{label}</div>
    </div>
  );
}