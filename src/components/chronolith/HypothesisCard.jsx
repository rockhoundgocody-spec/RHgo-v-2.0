import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, FlaskConical, XCircle, Atom } from 'lucide-react';

const CATEGORY_CFG = {
  extraterrestrial: { label: 'Extraterrestrial', color: '#a78bfa', bg: 'hsla(270,80%,50%,0.12)', border: 'hsla(270,80%,60%,0.35)' },
  industrial:       { label: 'Industrial',       color: '#fbbf24', bg: 'hsla(40,90%,45%,0.10)',  border: 'hsla(40,90%,55%,0.3)' },
  terrestrial:      { label: 'Terrestrial',      color: '#34d399', bg: 'hsla(160,70%,40%,0.10)', border: 'hsla(160,70%,50%,0.3)' },
  composite:        { label: 'Composite',        color: '#38bdf8', bg: 'hsla(200,90%,45%,0.10)', border: 'hsla(200,90%,55%,0.3)' },
  unknown:          { label: 'Unknown',          color: '#94a3b8', bg: 'hsla(215,20%,40%,0.10)', border: 'hsla(215,20%,50%,0.25)' },
};

function MetricBar({ label, value, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] uppercase tracking-widest text-white/30">{label}</span>
        <span className="text-[9px] font-mono font-bold" style={{ color }}>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function HypothesisCard({ hypothesis, isLeading, rank }) {
  const [expanded, setExpanded] = useState(isLeading);
  const h = hypothesis;
  const cat = CATEGORY_CFG[h.category] || CATEGORY_CFG.unknown;
  const prob = h.probability ?? 0;
  const isStrong = prob > 0.5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.08 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: isLeading
          ? `linear-gradient(135deg, ${cat.bg}, hsla(220,40%,5%,0.85))`
          : 'hsla(220,40%,5%,0.7)',
        border: `1px solid ${isLeading ? cat.border : 'hsla(270,20%,25%,0.25)'}`,
        boxShadow: isLeading ? `0 0 24px -4px ${cat.color}40` : 'none',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        {/* Probability ring */}
        <div className="relative shrink-0 mt-0.5">
          <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsla(0,0%,100%,0.06)" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15" fill="none" stroke={cat.color} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={94.2}
              initial={{ strokeDashoffset: 94.2 }}
              animate={{ strokeDashoffset: 94.2 - (94.2 * prob) }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold" style={{ color: cat.color }}>
            {Math.round(prob * 100)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
              {cat.label}
            </span>
            {isLeading && (
              <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                style={{ background: 'hsla(145,70%,30%,0.2)', color: '#34d399', border: '1px solid hsla(145,70%,50%,0.3)' }}>
                Leading
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-white/90 leading-tight">{h.name}</div>
          {!expanded && (
            <p className="text-white/40 text-xs mt-1 line-clamp-2">{h.description}</p>
          )}
        </div>

        {expanded
          ? <ChevronUp size={14} className="text-white/30 shrink-0 mt-1" />
          : <ChevronDown size={14} className="text-white/30 shrink-0 mt-1" />}
      </button>

      {/* Expanded body */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 pb-4 space-y-3"
        >
          {/* Description */}
          <p className="text-white/60 text-xs leading-relaxed">{h.description}</p>

          {/* Four independent metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricBar label="Probability" value={prob} color={cat.color} />
            <MetricBar label="Evidence Quality" value={h.evidence_quality ?? 0} color="#38bdf8" />
            <MetricBar label="Contradiction Load" value={h.contradiction_load ?? 0} color="#f87171" />
            <MetricBar label="Verification Depth" value={h.verification_depth ?? 0} color="#34d399" />
          </div>

          {/* Supporting evidence */}
          {h.supporting_evidence?.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1.5 flex items-center gap-1">
                <CheckCircle2 size={9} style={{ color: '#34d399' }} /> Supporting Evidence
              </div>
              <div className="space-y-1">
                {h.supporting_evidence.map((e, i) => (
                  <div key={i} className="text-xs text-white/65 pl-3 border-l-2 border-emerald-500/20">{e}</div>
                ))}
              </div>
            </div>
          )}

          {/* Contradictions */}
          {h.contradictions?.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1.5 flex items-center gap-1">
                <AlertTriangle size={9} style={{ color: '#f87171' }} /> Contradictions
              </div>
              <div className="space-y-1">
                {h.contradictions.map((c, i) => (
                  <div key={i} className="text-xs text-red-300/80 pl-3 border-l-2 border-red-500/30 bg-red-500/5 rounded-r py-1">{c}</div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions */}
          {h.predictions?.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1.5 flex items-center gap-1">
                <FlaskConical size={9} style={{ color: '#38bdf8' }} /> Predictions (if true)
              </div>
              <div className="space-y-1">
                {h.predictions.map((p, i) => (
                  <div key={i} className="text-xs text-white/55 pl-3 border-l-2 border-sky-500/20">{p}</div>
                ))}
              </div>
            </div>
          )}

          {/* Falsification */}
          {h.falsification_condition && (
            <div className="px-3 py-2.5 rounded-xl" style={{ background: 'hsla(40,90%,40%,0.08)', border: '1px solid hsla(40,90%,50%,0.2)' }}>
              <div className="text-[8px] uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: '#fbbf24' }}>
                <XCircle size={9} /> Falsification Condition
              </div>
              <p className="text-xs text-white/60">{h.falsification_condition}</p>
            </div>
          )}

          {/* Consequences */}
          {h.consequences_if_true && (
            <div className="px-3 py-2.5 rounded-xl" style={{ background: 'hsla(270,50%,15%,0.2)', border: '1px solid hsla(270,50%,40%,0.2)' }}>
              <div className="text-[8px] uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: '#a78bfa' }}>
                <Atom size={9} /> If True
              </div>
              <p className="text-xs text-white/60">{h.consequences_if_true}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}