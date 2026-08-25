import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PsvDeltaLog({ log = [] }) {
  const [open, setOpen] = useState(false);
  if (log.length <= 1) return null;

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-controls="delta-log-content"
        className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst/50">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Revision log · {log.length - 1} update{log.length > 2 ? 's' : ''}
        </span>
        {open ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
      </button>
      {open && (
        <div id="delta-log-content" className="divide-y divide-white/5">
          {log.slice(1).map((entry, i) => {
            const delta = entry.confidence_after - entry.confidence_before;
            const Icon = delta > 0.01 ? TrendingUp : delta < -0.01 ? TrendingDown : Minus;
            const color = delta > 0.01 ? 'text-emerald-400' : delta < -0.01 ? 'text-rose-400' : 'text-white/30';
            return (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <Icon size={12} className={`${color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/75">{entry.what_changed}</div>
                  {entry.why && <div className="text-[10px] text-white/35 mt-0.5 italic">{entry.why}</div>}
                </div>
                <div className={`text-[10px] font-mono shrink-0 ${color}`}>
                  {delta > 0 ? '+' : ''}{(delta * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}