import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MapStatusPanel — compact diagnostic readout for the Explore map.
 * Shows the load status of each data source so the user can see
 * exactly what failed (API key, hotspots, tile overlays, geolocation).
 *
 * status shape: { label: string, state: 'pending'|'ok'|'error'|'warn', detail?: string }
 */
export default function MapStatusPanel({ items = [] }) {
  const [expanded, setExpanded] = useState(false);

  const errorCount = items.filter((i) => i.state === 'error').length;
  const warnCount = items.filter((i) => i.state === 'warn').length;
  const pendingCount = items.filter((i) => i.state === 'pending').length;
  const okCount = items.filter((i) => i.state === 'ok').length;

  const summaryColor =
    errorCount > 0
      ? 'text-rose-300 border-rose-400/40'
      : warnCount > 0
      ? 'text-amber-300 border-amber-400/40'
      : pendingCount > 0
      ? 'text-hud-cyan/80 border-hud-cyan/30'
      : 'text-emerald-300 border-emerald-400/30';

  return (
    <div className={cn('rounded-md border bg-black/40 backdrop-blur-sm text-xs', summaryColor)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <StateIcon
            state={
              errorCount > 0 ? 'error' : warnCount > 0 ? 'warn' : pendingCount > 0 ? 'pending' : 'ok'
            }
          />
          <span className="uppercase tracking-[0.25em]">Data Status</span>
          <span className="text-white/60 normal-case tracking-normal">
            {okCount}/{items.length} ok
            {errorCount > 0 && ` · ${errorCount} failed`}
            {warnCount > 0 && ` · ${warnCount} warn`}
            {pendingCount > 0 && ` · ${pendingCount} loading`}
          </span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <ul className="border-t border-white/10 divide-y divide-white/5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 px-3 py-2">
              <span className="mt-0.5 shrink-0">
                <StateIcon state={item.state} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-white/90">{item.label}</div>
                {item.detail && (
                  <div className="text-white/50 text-[11px] mt-0.5 break-words">{item.detail}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StateIcon({ state }) {
  if (state === 'ok') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (state === 'error') return <XCircle size={14} className="text-rose-400" />;
  if (state === 'warn') return <AlertTriangle size={14} className="text-amber-400" />;
  return <Loader2 size={14} className="text-hud-cyan/80 animate-spin" />;
}