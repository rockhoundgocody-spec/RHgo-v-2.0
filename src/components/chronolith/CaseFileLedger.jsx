import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Target, ChevronDown, ChevronUp } from 'lucide-react';

const SEVERITY_CFG = {
  low:      { color: '#fbbf24', bg: 'hsla(40,90%,40%,0.08)' },
  medium:   { color: '#fb923c', bg: 'hsla(25,90%,40%,0.08)' },
  high:     { color: '#f87171', bg: 'hsla(0,70%,40%,0.08)' },
  critical: { color: '#ef4444', bg: 'hsla(0,80%,40%,0.12)' },
};

export default function CaseFileLedger({
  evidence = [],
  contradictions = [],
  missing = [],
  showLedger,
  onToggleLedger
}) {
  const contentId = useId();

  return (
    <>
      <button
        type="button"
        onClick={onToggleLedger}
        aria-expanded={Boolean(showLedger)}
        aria-controls={contentId}
        aria-label={showLedger ? 'Collapse case file ledger' : 'Expand case file ledger'}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
        style={{ background: 'hsla(220,40%,5%,0.6)', border: '1px solid hsla(270,20%,25%,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-white/40" aria-hidden="true" />
          <span className="text-xs font-semibold text-white/60">Case File</span>
          <span className="text-[9px] text-white/30">
            {evidence.length} evidence · {contradictions.length} contradictions · {missing.length} missing
          </span>
        </div>
        {showLedger ? (
          <ChevronUp size={14} className="text-white/30" aria-hidden="true" />
        ) : (
          <ChevronDown size={14} className="text-white/30" aria-hidden="true" />
        )}
      </button>

      {showLedger && (
        <motion.div
          id={contentId}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 overflow-hidden"
        >
          {/* Contradictions */}
          {contradictions.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-red-400/60 mb-1.5 px-1 flex items-center gap-1">
                <AlertTriangle size={9} /> Contradiction Ledger
              </div>
              <div className="space-y-1.5">
                {contradictions.map((c, i) => {
                  const sev = SEVERITY_CFG[c.severity] || SEVERITY_CFG.medium;
                  return (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-lg text-xs"
                      style={{ background: sev.bg, border: `1px solid ${sev.color}30` }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ background: `${sev.color}20`, color: sev.color }}
                        >
                          {c.severity}
                        </span>
                      </div>
                      <p className="text-white/60">{c.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidence ledger */}
          {evidence.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-cyan-400/60 mb-1.5 px-1 flex items-center gap-1">
                <FileText size={9} /> Evidence Ledger
              </div>
              <div className="space-y-1">
                {evidence.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'hsla(220,40%,6%,0.4)' }}
                  >
                    <span
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                      style={{ background: 'hsla(195,80%,30%,0.2)', color: '#67e8f9' }}
                    >
                      {e.source}
                    </span>
                    <span className="text-white/55 flex-1">{e.observation}</span>
                    <span className="text-[8px] font-mono text-white/30 shrink-0 mt-0.5">
                      {Math.round((e.reliability || 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing evidence — missions */}
          {missing.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-amber-400/60 mb-1.5 px-1 flex items-center gap-1">
                <Target size={9} /> Missing Evidence — Missions
              </div>
              <div className="space-y-1">
                {missing.map((m, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-lg text-xs text-white/55"
                    style={{
                      background: 'hsla(40,90%,35%,0.06)',
                      border: '1px solid hsla(40,90%,50%,0.12)'
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
