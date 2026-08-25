import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Scale } from 'lucide-react';
import HypothesisCard from './HypothesisCard.jsx';
import TestSelector from './TestSelector.jsx';
import ObservationForm from './ObservationForm.jsx';
import CaseHeader from './CaseHeader.jsx';
import UncertaintyStatement from './UncertaintyStatement.jsx';
import CaseFileLedger from './CaseFileLedger.jsx';
import ScientificExplanation from './ScientificExplanation.jsx';

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
      <CaseHeader
        hypothesesCount={hypotheses.length}
        contradictionsCount={contradictions.length}
        onReset={onReset}
      />

      {/* Specimen + uncertainty statement */}
      <UncertaintyStatement
        imageUrl={imageUrl}
        uncertaintyStatement={caseData?.uncertainty_statement}
      />

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
      <CaseFileLedger
        evidence={evidence}
        contradictions={contradictions}
        missing={missing}
        showLedger={showLedger}
        onToggleLedger={() => setShowLedger(!showLedger)}
      />

      {/* Scientific explanation */}
      <ScientificExplanation
        scientificExplanation={caseData?.scientific_explanation}
      />

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
