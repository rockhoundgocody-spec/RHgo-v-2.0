import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import EvidenceList from './EvidenceList.jsx';
import FieldDecisionCard from './FieldDecisionCard.jsx';

const bandConfig = {
  high:   { color: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  medium: { color: 'text-amber-300',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   icon: HelpCircle },
  low:    { color: 'text-rose-300',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10',    icon: AlertTriangle },
};

/**
 * ReasoningSummary — main output card for any HRM reasoning result.
 * Shows confidence, evidence, summary, and recommended action.
 * "Why this result?" expands full reasoning + uncertainties.
 */
export default function ReasoningSummary({ result, onAction, className }) {
  const [expanded, setExpanded] = useState(false);
  if (!result) return null;

  const {
    primaryResult,
    confidenceBand,
    confidenceScore,
    evidenceUsed = [],
    uncertainties = [],
    improvementHints = [],
    recommendedAction,
    reasoningSummary,
    needsMoreEvidence,
    isOfflineFallback,
  } = result;

  const cfg = bandConfig[confidenceBand] || bandConfig.low;
  const Icon = cfg.icon;
  const pct = Math.round(confidenceScore * 100);

  return (
    <div className={cn('rounded-2xl border overflow-hidden', cfg.border, className)}>
      {/* Header band */}
      <div className={cn('flex items-center justify-between px-4 py-3', cfg.bg)}>
        <div className="flex items-center gap-2">
          <Icon size={14} className={cfg.color} />
          <span className={cn('text-[11px] uppercase tracking-[0.3em] font-medium', cfg.color)}>
            {confidenceBand === 'high' ? 'High confidence' : confidenceBand === 'medium' ? 'Moderate confidence' : 'Low confidence'}
          </span>
        </div>
        <span className={cn('text-[11px] font-mono', cfg.color)}>{pct}%</span>
      </div>

      <div className="bg-black/30 px-4 py-4 space-y-3">
        {/* Primary result */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">Result</div>
          <div className="text-lg font-semibold text-white">{primaryResult}</div>
        </div>

        {/* Offline / needs-more-evidence alerts */}
        {isOfflineFallback && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
            Offline mode — saved locally, will sync on reconnect.
          </div>
        )}
        {needsMoreEvidence && !isOfflineFallback && improvementHints.length > 0 && (
          <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2 space-y-1">
            <div className="font-medium">More evidence needed:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {improvementHints.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        )}

        {/* Evidence */}
        {evidenceUsed.length > 0 && <EvidenceList evidence={evidenceUsed} />}

        {/* Recommended action */}
        {recommendedAction && <FieldDecisionCard action={recommendedAction} onAction={onAction} />}

        {/* Expandable reasoning */}
        {(reasoningSummary || uncertainties.length > 0) && (
          <div>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-amethyst/60 hover:text-amethyst-glow transition mt-1"
            >
              <Brain size={11} />
              Why this result?
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {reasoningSummary && (
                  <p className="text-sm text-white/75 leading-relaxed border-l-2 border-amethyst/30 pl-3 italic">
                    {reasoningSummary}
                  </p>
                )}
                {uncertainties.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1">Uncertainties</div>
                    <ul className="space-y-1">
                      {uncertainties.map((u, i) => (
                        <li key={i} className="text-xs text-amber-300/80 flex gap-1.5">
                          <span className="text-amber-500/60 mt-0.5">•</span>{u}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {improvementHints.length > 0 && confidenceBand !== 'low' && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1">Would improve result</div>
                    <ul className="space-y-1">
                      {improvementHints.map((h, i) => (
                        <li key={i} className="text-xs text-white/50 flex gap-1.5">
                          <span className="text-white/30 mt-0.5">•</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}