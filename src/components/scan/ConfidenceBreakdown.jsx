import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const bandColor = (pct) => {
  if (pct >= 80) return { text: 'text-emerald-300', bar: 'bg-emerald-500', label: 'High' };
  if (pct >= 60) return { text: 'text-amber-300', bar: 'bg-amber-400', label: 'Moderate' };
  return { text: 'text-rose-300', bar: 'bg-rose-500', label: 'Low' };
};

export default function ConfidenceBreakdown({ topCandidate, candidates = [], source = 'mock' }) {
  const [expanded, setExpanded] = useState(false);

  if (!topCandidate) return null;

  const pct = Math.round(topCandidate.confidence);
  const bc = bandColor(pct);

  return (
    <GlassPanel className="p-5 space-y-4">
      {/* Top match */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">{topCandidate.name}</span>
          <span className={`text-xs font-mono font-bold ${bc.text}`}>{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${bc.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[10px] text-white/40 mt-1">{topCandidate.scientificName}</div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border ${
          pct >= 80 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' :
          pct >= 60 ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' :
          'border-rose-500/30 bg-rose-500/10 text-rose-300'
        }`}>
          {bc.label} Confidence
        </span>
        <span className="text-[9px] font-mono text-white/30">Source: {source}</span>
      </div>

      {/* Candidates list */}
      {candidates.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-2 text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/60 transition"
        >
          <span>{candidates.length} Candidates</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {expanded && candidates.length > 1 && (
        <div className="space-y-2">
          {candidates.slice(1).map((cand, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/10 bg-white/5">
              <span className="text-xs text-white/70">{cand.name}</span>
              <span className="text-xs font-mono text-white/40">{Math.round(cand.confidence)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Low confidence warning */}
      {pct < 80 && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
          <span className="text-amber-400 text-xs font-bold mt-0.5">⚠</span>
          <span className="text-[11px] text-amber-300/80">Low confidence. Run field tests to verify before committing to collection.</span>
        </div>
      )}
    </GlassPanel>
  );
}