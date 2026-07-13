import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import HypothesisCard from './HypothesisCard.jsx';
import TestSelector from './TestSelector.jsx';
import ObservationForm from './ObservationForm.jsx';
import { Scale, FileText, AlertTriangle, Target, ChevronDown, ChevronUp, Eye, Microscope } from 'lucide-react';

const SEVERITY_CFG = {
  low:      { color: '#fbbf24', bg: 'hsla(40,90%,40%,0.08)' },
  medium:   { color: '#fb923c', bg: 'hsla(25,90%,40%,0.08)' },
  high:     { color: '#f87171', bg: 'hsla(0,70%,40%,0.08)' },
  critical: { color: '#ef4444', bg: 'hsla(0,80%,40%,0.12)' },
};

export default function RealityTrial({ caseData, imageUrl, onAddEvidence, loading, onReset }) {
  const [obsOpen, setObsOpen] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  const hypotheses = caseData?.hypotheses || [];
  const sortedH = [...hypotheses].sort((a, b) => (b.probability || 0) - (a.probability || 0));
  const leadingH = sortedH[0];
  const nextTest = caseData?.next_test;
  const contradictions = caseData?.contradiction_ledger || [];
  const evidence = caseData?.evidence_ledger || [];
  const missing = caseData?.missing_evidence || [];

  const handleSubmitEvidence = (observations) => {
    setObsOpen(false);
    onAddEvidence(observations);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header — the court room */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-1"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsla(270,60%,30%,0.3)', border: '1px solid hsla(270,80%,60%,0.3)' }}>
          <Scale size={16} className="text-amethyst-glow" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-black text-white tracking-tight leading-none">Reality Trial</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-0.5">
            {hypotheses.length} competing histories · {contradictions.length} contradictions
          </p>
        </div>
        <button onClick={onReset}
          className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60 transition px-2 py-1 rounded-lg border border-white/10">
          New Case
        </button>
      </motion.div>

      {/* Specimen + uncertainty statement */}
      {caseData?.uncertainty_statement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 p-3 rounded-2xl"
          style={{ background: 'hsla(220,40%,5%,0.6)', border: '1px solid hsla(270,20%,25%,0.2)' }}
        >
          {imageUrl && (
            <img src={imageUrl} alt="specimen" className="w-14 h-14 rounded-xl object-cover shrink-0 opacity-80"
              style={{ border: '1px solid hsla(270,30%,40%,0.2)' }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1 flex items-center gap-1">
              <Eye size={9} /> Uncertainty Statement
            </div>
            <p className="text-xs text-white/65 leading-relaxed">{caseData.uncertainty_statement}</p>
          </div>
        </motion.div>
      )}

      {/* Hypothesis cards — the competing histories */}
      <div className="space-y-2.5">
        <div className="text-[9px] uppercase tracking-widest text-white/30 px-1 flex items-center gap-1.5">
          <Scale size={10} /> Competing Hypotheses
        </div>
        <AnimatePresence mode="popLayout">
          {sortedH.map((h, i) => (
            <HypothesisCard
              key={h.id || i}
              hypothesis={h}
              isLeading={h === leadingH}
              rank={i}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Optimal next test */}
      {nextTest && (
        <TestSelector
          nextTest={nextTest}
          onEnterResult={() => setObsOpen(true)}
          loading={loading}
        />
      )}

      {/* Evidence + Contradiction Ledger */}
      <button
        onClick={() => setShowLedger(!showLedger)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition"
        style={{ background: 'hsla(220,40%,5%,0.6)', border: '1px solid hsla(270,20%,25%,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-white/40" />
          <span className="text-xs font-semibold text-white/60">Case File</span>
          <span className="text-[9px] text-white/30">
            {evidence.length} evidence · {contradictions.length} contradictions · {missing.length} missing
          </span>
        </div>
        {showLedger ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
      </button>

      {showLedger && (
        <motion.div
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
                    <div key={i} className="px-3 py-2 rounded-lg text-xs"
                      style={{ background: sev.bg, border: `1px solid ${sev.color}30` }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ background: `${sev.color}20`, color: sev.color }}>
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
                  <div key={i} className="flex items-start gap-2 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'hsla(220,40%,6%,0.4)' }}>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                      style={{ background: 'hsla(195,80%,30%,0.2)', color: '#67e8f9' }}>
                      {e.source}
                    </span>
                    <span className="text-white/55 flex-1">{e.observation}</span>
                    <span className="text-[8px] font-mono text-white/30 shrink-0 mt-0.5">{Math.round((e.reliability || 0) * 100)}%</span>
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
                  <div key={i} className="px-3 py-2 rounded-lg text-xs text-white/55"
                    style={{ background: 'hsla(40,90%,35%,0.06)', border: '1px solid hsla(40,90%,50%,0.12)' }}>
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Scientific explanation */}
      {caseData?.scientific_explanation && (
        <div className="p-4 rounded-2xl"
          style={{ background: 'hsla(220,40%,5%,0.6)', border: '1px solid hsla(270,20%,25%,0.2)' }}>
          <div className="text-[8px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
            <Microscope size={10} /> Scientific Explanation
          </div>
          <p className="text-xs text-white/65 leading-relaxed">{caseData.scientific_explanation}</p>
        </div>
      )}

      {/* Observation form */}
      <ObservationForm
        open={obsOpen}
        onClose={() => setObsOpen(false)}
        onSubmit={handleSubmitEvidence}
        loading={loading}
        suggestedTest={nextTest?.test_name}
      />
    </div>
  );
}