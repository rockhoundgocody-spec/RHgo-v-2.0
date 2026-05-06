import React, { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function CorrectionPanel({ topCandidate, onSubmitCorrection }) {
  const [selectedMineral, setSelectedMineral] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (onSubmitCorrection) {
      await onSubmitCorrection({
        reportedIncorrectId: topCandidate?.mineralId,
        suggestedCorrectId: selectedMineral,
        userNotes: notes
      });
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <GlassPanel className="p-5 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle size={14} className="text-amber-300 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-white">Was the ID incorrect?</div>
          <div className="text-[11px] text-white/50 mt-0.5">
            Help improve future identifications by reporting corrections.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-white/60 uppercase tracking-[0.2em] font-mono">
          What should it be?
        </label>
        <input
          type="text"
          placeholder="Type the correct mineral name…"
          value={selectedMineral}
          onChange={(e) => setSelectedMineral(e.target.value)}
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amethyst/50"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-white/60 uppercase tracking-[0.2em] font-mono">
          Field observations (optional)
        </label>
        <textarea
          placeholder="E.g., hardness test results, color details…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amethyst/50 h-20 resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedMineral.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst disabled:opacity-40 text-white font-semibold text-sm transition active:scale-[0.98]"
      >
        <Send size={14} /> Submit Correction
      </button>

      {submitted && (
        <div className="text-xs text-emerald-300 text-center">
          Thank you! Your correction helps the community.
        </div>
      )}
    </GlassPanel>
  );
}