import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Save, RotateCcw, ChevronDown, ChevronUp, Tag, FlaskConical } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function PsvFinalCard({ result, draft, onSave, onRescan }) {
  const [showDetails, setShowDetails] = useState(false);
  if (!result) return null;

  const pct = Math.round(result.confidence * 100);
  const isHigh = pct >= 75;

  return (
    <GlassPanel className="p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={16} className="text-emerald-400" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70">Final Result</span>
      </div>
      <div className="text-2xl font-bold text-white">{result.primary_name}</div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isHigh ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-[11px] font-mono ${isHigh ? 'text-emerald-300' : 'text-amber-300'}`}>{pct}%</span>
      </div>

      {result.evidence_summary && <p className="text-white/75 text-sm leading-relaxed">{result.evidence_summary}</p>}

      {result.safety_warning && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5">
          <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-rose-300 text-sm">{result.safety_warning}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {result.value_range && (
          <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300">
            <Tag size={10} /> {result.value_range}
          </div>
        )}
        {result.next_test && result.next_test !== 'None needed' && (
          <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
            <FlaskConical size={10} /> {result.next_test}
          </div>
        )}
      </div>

      {result.collection_note && (
        <p className="text-white/50 text-xs italic border-l-2 border-amethyst/20 pl-3">{result.collection_note}</p>
      )}

      {result.lookalikes_ruled_out?.length > 0 && (
        <div>
          <button onClick={() => setShowDetails((p) => !p)}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-amethyst/50 hover:text-amethyst-glow transition">
            Ruled-out lookalikes {showDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showDetails && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.lookalikes_ruled_out.map((n, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 line-through">{n}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amethyst-deep hover:bg-amethyst border border-amethyst/40 text-white font-semibold text-sm transition active:scale-[0.98]">
          <Save size={14} /> Save to collection
        </button>
        <button onClick={onRescan}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition text-sm">
          <RotateCcw size={14} />
        </button>
      </div>
    </GlassPanel>
  );
}