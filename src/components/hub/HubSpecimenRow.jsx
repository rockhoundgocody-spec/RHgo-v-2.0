import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, MapPin, Calendar, ShieldCheck, ChevronDown, ExternalLink, Activity } from 'lucide-react';

const RARITY_STYLES = {
  common: 'border-hud-blue/35 bg-hud-blue/10 text-hud-blue',
  uncommon: 'border-hud-cyan/45 bg-hud-cyan/15 text-hud',
  rare: 'border-hud-cyan/70 bg-hud-cyan/20 text-hud glow-hud',
  legendary: 'border-hud-cyan bg-hud-cyan/25 text-foreground glow-hud',
};

export default function HubSpecimenRow({ specimen }) {
  const [expanded, setExpanded] = useState(false);
  const rarity = (specimen.rarity || 'common').toLowerCase();
  const badgeClass = RARITY_STYLES[rarity] || RARITY_STYLES.common;
  const confidencePct = specimen.ai_confidence != null
    ? `${Math.round(Number(specimen.ai_confidence) * (specimen.ai_confidence <= 1 ? 100 : 1))}%`
    : null;

  return (
    <div className="rounded-xl border border-hud-cyan/25 bg-background/60 transition-colors hover:border-hud-cyan/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 p-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan rounded-xl"
      >
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-hud-cyan/35 bg-hud-grid/30 flex items-center justify-center">
          {specimen.image_url ? (
            <img
              src={specimen.image_url}
              alt={specimen.mineral_name || 'Specimen'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Gem size={18} className="text-hud" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground truncate">
              {specimen.mineral_name || 'Unidentified Mineral'}
            </span>
            {specimen.verified && (
              <ShieldCheck size={12} className="text-hud shrink-0" title="Verified Specimen" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-hud-blue/80 mt-0.5 truncate">
            {specimen.found_at && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin size={10} className="text-hud-cyan/70 shrink-0" />
                <span className="truncate">{specimen.found_at}</span>
              </span>
            )}
            {specimen.found_date && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Calendar size={10} className="text-hud-cyan/70" />
                {String(specimen.found_date).slice(0, 10)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider ${badgeClass}`}>
            {rarity}
          </span>
          <ChevronDown
            size={14}
            className={`text-hud-cyan/70 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1.5 border-t border-hud-cyan/15 space-y-2 text-[11px]">
          <div className="grid grid-cols-3 gap-1.5 font-mono">
            <div className="rounded-lg bg-hud-grid/20 border border-hud-cyan/20 px-2 py-1">
              <span className="block text-[9px] uppercase tracking-wider text-hud-blue/70">Confidence</span>
              <span className="text-hud font-bold">{confidencePct || 'Field Log'}</span>
            </div>
            <div className="rounded-lg bg-hud-grid/20 border border-hud-cyan/20 px-2 py-1">
              <span className="block text-[9px] uppercase tracking-wider text-hud-blue/70">Luster / Habit</span>
              <span className="text-foreground/90 truncate block">
                {specimen.field_luster || specimen.field_habit || 'Standard'}
              </span>
            </div>
            <div className="rounded-lg bg-hud-grid/20 border border-hud-cyan/20 px-2 py-1">
              <span className="block text-[9px] uppercase tracking-wider text-hud-blue/70">Status</span>
              <span className="text-hud-cyan uppercase">
                {specimen.disposition || (specimen.verified ? 'Verified' : 'Logged')}
              </span>
            </div>
          </div>

          {specimen.notes && (
            <p className="text-foreground/75 text-[11px] leading-relaxed bg-hud-grid/15 rounded-lg px-2.5 py-1.5 border border-hud-cyan/15">
              {specimen.notes}
            </p>
          )}

          <div className="flex items-center justify-between pt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-hud-blue/75">
              <Activity size={11} className="text-hud" />
              {specimen.common_name || specimen.mineral_name}
            </span>
            <Link
              to={`/specimen/${specimen.id}`}
              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-hud hover:underline"
            >
              Full Dossier
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}