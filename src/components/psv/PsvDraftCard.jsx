import React, { useState } from 'react';
import { Atom, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const bandColor = (pct) => {
  if (pct >= 75) return { text: 'text-emerald-300', bar: 'bg-emerald-500', label: 'High' };
  if (pct >= 45) return { text: 'text-amber-300', bar: 'bg-amber-400', label: 'Moderate' };
  return { text: 'text-rose-300', bar: 'bg-rose-500', label: 'Low' };
};

export default function PsvDraftCard({ draft, revisions, confidencePct }) {
  const bc = bandColor(confidencePct);
  const [showDetails, setShowDetails] = useState(false);
  const traits = draft.verification_plan?.flatMap?.(() => []) || [];
  const uncertainties = draft.next_question ? [] : [];

  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Atom size={14} className="text-amethyst-glow" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-amethyst/60">
            {revisions === 0 ? 'Initial Draft' : `Draft · Rev ${revisions}`}
          </span>
        </div>
        <div className={`text-[10px] font-mono uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border ${
          confidencePct >= 75 ? 'border-emerald-500/30 bg-emerald-500/10' :
          confidencePct >= 45 ? 'border-amber-400/30 bg-amber-400/10' :
          'border-rose-500/30 bg-rose-500/10'
        } ${bc.text}`}>{bc.label}</div>
      </div>

      <div className="text-3xl font-bold text-white mb-0.5 leading-tight">{draft.primary_name}</div>
      {draft.common_name && draft.common_name !== draft.primary_name && (
        <div className="text-amethyst/60 text-sm mb-3">{draft.common_name}</div>
      )}

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>Confidence</span>
          <span className={`font-mono font-bold ${bc.text}`}>{confidencePct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${bc.bar}`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {draft.rarity && (
          <div className="text-[10px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border border-white/10 text-white/50 bg-white/5">
            {draft.rarity}
          </div>
        )}
        {revisions === 0 && (
          <div className="text-[10px] text-amethyst/50 italic">Noisy initial draft — refine with field evidence below</div>
        )}
      </div>

      {/* Expandable: lookalikes + uncertainty */}
      {(draft.verification_plan?.length > 0) && (
        <button
          onClick={() => setShowDetails(p => !p)}
          className="mt-3 w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/50 transition py-1"
        >
          <span>Verification plan · {draft.verification_plan.length} tests</span>
          {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}
      {showDetails && draft.verification_plan?.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {draft.verification_plan.slice(0, 5).map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-amethyst/40 font-mono shrink-0">{t.priority ?? i + 1}.</span>
              <div>
                <span className="text-white/70 font-medium">{t.test}</span>
                {t.why && <span className="text-white/35 ml-1.5">{t.why}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}