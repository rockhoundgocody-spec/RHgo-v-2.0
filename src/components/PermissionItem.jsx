import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function PermissionItem({ item, loading }) {
  const Icon = item.icon;
  const status = item.granted ? 'Enabled' : item.denied ? 'Blocked' : null;

  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: item.granted
            ? 'hsla(150,70%,30%,0.2)'
            : item.isUpdate
              ? 'hsla(38,90%,40%,0.2)'
              : 'hsla(265,50%,25%,0.3)',
          border: item.granted
            ? '1px solid hsla(150,70%,50%,0.35)'
            : item.isUpdate
              ? '1px solid hsla(38,90%,55%,0.4)'
              : '1px solid hsla(280,60%,55%,0.25)',
        }}
      >
        {item.granted
          ? <CheckCircle2 size={16} className="text-emerald-400" />
          : <Icon size={16} style={{ color: item.isUpdate ? '#fbbf24' : 'hsl(280,85%,82%)' }} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white text-[12px] font-semibold leading-tight">{item.label}</div>
        <div className="text-white/50 text-[10px] leading-snug">{item.desc}</div>
      </div>

      {status ? (
        <span className="text-[10px] font-semibold text-white/55" aria-live="polite">{status}</span>
      ) : (
        <button
          type="button"
          onClick={item.onRequest}
          disabled={loading}
          aria-busy={loading || undefined}
          className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow motion-reduce:transform-none motion-reduce:transition-none"
          style={{
            background: item.isUpdate ? 'hsla(38,90%,40%,0.25)' : 'hsla(280,60%,35%,0.35)',
            border: item.isUpdate ? '1px solid hsla(38,90%,55%,0.4)' : '1px solid hsla(280,60%,55%,0.35)',
            color: item.isUpdate ? '#fbbf24' : 'hsl(280,100%,88%)',
          }}
        >
          {loading ? 'Working…' : item.isUpdate ? 'Update' : 'Allow'}
        </button>
      )}
    </div>
  );
}
