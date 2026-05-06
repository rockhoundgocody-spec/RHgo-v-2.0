import React from 'react';
import { Atom } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const bandColor = (pct) => {
  if (pct >= 75) return { text: 'text-emerald-300', bar: 'bg-emerald-500', label: 'High' };
  if (pct >= 45) return { text: 'text-amber-300', bar: 'bg-amber-400', label: 'Moderate' };
  return { text: 'text-rose-300', bar: 'bg-rose-500', label: 'Low' };
};

export default function PsvDraftCard({ draft, revisions, confidencePct }) {
  const bc = bandColor(confidencePct);
  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Atom size={14} className="text-amethyst-glow" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-amethyst/60">
            {revisions === 0 ? 'Initial draft' : `Draft · Rev ${revisions}`}
          </span>
        </div>
        <div className={`text-[10px] font-mono uppercase tracking-[0.25em] ${bc.text}`}>{bc.label}</div>
      </div>

      <div className="text-2xl font-bold text-white mb-1">{draft.primary_name}</div>
      {draft.common_name && draft.common_name !== draft.primary_name && (
        <div className="text-amethyst/60 text-sm mb-3">{draft.common_name}</div>
      )}

      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>Confidence</span>
          <span className={bc.text}>{confidencePct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${bc.bar}`} style={{ width: `${confidencePct}%` }} />
        </div>
      </div>

      {draft.rarity && (
        <div className="inline-block text-[10px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border border-white/10 text-white/50 bg-white/5">
          {draft.rarity}
        </div>
      )}

      {revisions === 0 && (
        <p className="mt-3 text-white/40 text-xs leading-relaxed border-l-2 border-amethyst/20 pl-3 italic">
          Noisy initial draft — answer the field questions below to refine it.
        </p>
      )}
    </GlassPanel>
  );
}