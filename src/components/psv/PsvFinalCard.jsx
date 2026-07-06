import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Save, RotateCcw,
  ChevronDown, ChevronUp, Tag, FlaskConical,
  Users, Shield, TrendingUp, MapPin
} from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const REVIEWER_META = {
  mineral_id:     { icon: CheckCircle2, label: 'Mineral ID',    color: 'text-amethyst-glow' },
  lookalike_risk: { icon: Users,        label: 'Lookalikes',    color: 'text-amber-300' },
  field_test:     { icon: FlaskConical, label: 'Field Tests',   color: 'text-hud-cyan' },
  locality:       { icon: MapPin,       label: 'Locality',      color: 'text-emerald-300' },
  safety:         { icon: Shield,       label: 'Safety',        color: 'text-rose-300' },
  value:          { icon: TrendingUp,   label: 'Value',         color: 'text-violet-300' },
};

export default function PsvFinalCard({ result, draft, onSave, onRescan }) {
  const [showReviewers, setShowReviewers] = useState(false);
  const [showLookalikes, setShowLookalikes] = useState(false);
  if (!result) return null;

  const pct = Math.round(result.confidence * 100);
  const isHigh = pct >= 75;
  const reviewResults = draft?.review_results || {};

  return (
    <div className="space-y-3">
      <GlassPanel className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70">
            Final Verified Result
          </span>
          <span className="ml-auto text-[10px] text-white/30 font-mono">
            {draft?.revision ?? 0} revision{draft?.revision !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="text-3xl font-bold text-white leading-tight mb-1">{result.primary_name}</div>

        {/* Confidence */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isHigh ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-sm font-bold font-mono ${isHigh ? 'text-emerald-300' : 'text-amber-300'}`}>
            {pct}%
          </span>
        </div>

        {result.evidence_summary && (
          <p className="text-white/75 text-sm leading-relaxed mb-4">{result.evidence_summary}</p>
        )}

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {result.value_range && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300">
              <Tag size={11} /> {result.value_range}
            </div>
          )}
          {result.next_test && result.next_test !== 'None needed' && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
              <FlaskConical size={11} /> Next: {result.next_test}
            </div>
          )}
        </div>

        {result.collection_note && (
          <p className="text-white/45 text-xs italic border-l-2 border-amethyst/20 pl-3 mb-4">
            {result.collection_note}
          </p>
        )}

        {/* Safety */}
        {result.safety_warning && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-2xl px-4 py-3 mb-4">
            <AlertTriangle size={15} className="text-rose-400 mt-0.5 shrink-0" />
            <p className="text-rose-300 text-sm leading-snug">{result.safety_warning}</p>
          </div>
        )}

        {/* Lookalikes ruled out */}
        {result.lookalikes_ruled_out?.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowLookalikes(p => !p)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-white/35 hover:text-white/55 transition mb-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 rounded-sm"
            >
              Ruled-out lookalikes {showLookalikes ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showLookalikes && (
              <div className="flex flex-wrap gap-1.5">
                {result.lookalikes_ruled_out.map((n, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/35 line-through">{n}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save / Rescan CTAs */}
        <div className="flex gap-2.5">
          <button
            onClick={onSave}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-amethyst-deep hover:bg-amethyst border border-amethyst/40 text-white font-bold text-base active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
          >
            <Save size={16} /> Save to Collection
          </button>
          <button
            onClick={onRescan}
            aria-label="Rescan"
            className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </GlassPanel>

      {/* Multi-agent reviewer breakdown */}
      {Object.keys(reviewResults).length > 0 && (
        <GlassPanel className="p-4">
          <button
            onClick={() => setShowReviewers(p => !p)}
            className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/35 hover:text-white/55 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 rounded-sm"
          >
            <span>6 Specialist Reviewers</span>
            {showReviewers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showReviewers && (
            <div className="mt-3 space-y-3">
              {Object.entries(REVIEWER_META).map(([key, meta]) => {
                const data = reviewResults[key];
                if (!data) return null;
                const Icon = meta.icon;
                return (
                  <div key={key} className="border-l-2 border-white/10 pl-3">
                    <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] mb-1 ${meta.color}`}>
                      <Icon size={10} /> {meta.label}
                    </div>
                    <div className="text-white/55 text-xs leading-relaxed font-mono">
                      {Object.entries(data)
                        .filter(([k, v]) => v !== null && v !== undefined && typeof v !== 'object')
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <div key={k}><span className="text-white/30">{k}:</span> {String(v)}</div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>
      )}
    </div>
  );
}