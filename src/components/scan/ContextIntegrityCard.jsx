import React from 'react';
import { ShieldCheck, AlertTriangle, FlaskConical, Info } from 'lucide-react';

const GRADE_COLORS = {
  A: '#34d399', B: '#38bdf8', C: '#fbbf24', D: '#fb923c', F: '#f87171',
};

/**
 * ContextIntegrityCard — surfaces the evidence-quality grade, mandatory
 * handbook disclaimers, and the entropy-based Tier 2 field-test trigger
 * directly on the scan result.
 */
export default function ContextIntegrityCard({ integrity, handbook, essence, onRunTests }) {
  if (!integrity && !handbook && !essence) return null;
  const grade = integrity?.grade || null;
  const gradeColor = GRADE_COLORS[grade] || '#94a3b8';
  const disclaimers = handbook?.disclaimers || [];
  const missing = integrity?.missing_evidence || [];

  return (
    <div className="mt-4 space-y-3">
      {/* Tier 2 trigger — visual ambiguity too high, run field tests */}
      {essence?.tier2_triggered && (
        <button onClick={onRunTests}
          className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition active:scale-[0.99]"
          style={{ background: 'hsla(35,90%,25%,0.25)', border: '1px solid hsla(35,90%,55%,0.4)' }}>
          <FlaskConical size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300">
              Field tests recommended — ambiguity {essence.entropy_bits} bits (threshold {essence.entropy_trigger_bits})
            </div>
            <div className="text-[10px] text-white/45 mt-0.5">
              The visual match is too close between candidates. Tap to see the streak, hardness, and UV tests that will resolve it.
            </div>
          </div>
        </button>
      )}

      {/* Context Integrity grade */}
      {integrity && (
        <div className="p-3 rounded-xl" style={{ background: 'hsla(220,40%,7%,0.7)', border: `1px solid ${gradeColor}40` }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-base"
              style={{ background: `${gradeColor}1a`, color: gradeColor, border: `1px solid ${gradeColor}50` }}>
              {grade}
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1.5">
                <ShieldCheck size={10} /> Evidence Integrity
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.round((integrity.score || 0) * 100)}%`, background: gradeColor }} />
              </div>
            </div>
            <span className="text-[10px] font-mono text-white/40">cap {Math.round((integrity.confidence_cap || 0) * 100)}%</span>
          </div>
          {missing.length > 0 && (
            <div className="space-y-1">
              {missing.slice(0, 3).map((m, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/45">
                  <AlertTriangle size={9} className="text-amber-400/70 mt-0.5 shrink-0" />
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Handbook disclaimers */}
      {disclaimers.length > 0 && (
        <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'hsla(220,40%,7%,0.5)', border: '1px solid hsla(270,20%,25%,0.3)' }}>
          {disclaimers.map((d, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/40 leading-relaxed">
              <Info size={9} className="text-white/25 mt-0.5 shrink-0" />
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}