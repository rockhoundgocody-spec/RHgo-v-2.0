import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { RotateCcw, Plus, Share2 } from 'lucide-react';
import PipelineStatusPanel from '@/components/scan/PipelineStatusPanel.jsx';
import ConfidenceBreakdown from '@/components/scan/ConfidenceBreakdown.jsx';
import SimilarMinerals from '@/components/scan/SimilarMinerals.jsx';
import CorrectionPanel from '@/components/scan/CorrectionPanel.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function ScanResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scanResult, photoUrl, location: siteLocation, userNotes } = location.state || {};
  const [enriching, setEnriching] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);

  if (!scanResult) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white/60">No scan result found.</p>
          <button
            onClick={() => navigate('/scan')}
            className="mt-4 px-4 py-2 bg-amethyst-deep rounded-lg text-white"
          >
            Back to Scan
          </button>
        </div>
      </div>
    );
  }

  const { topCandidate, candidates, matchReasons, recommendedTests, cautionFlags, pipelineMeta } = scanResult;

  const handleAddToCollection = async () => {
    setEnriching(true);
    try {
      const { runPipeline } = await import('@/services/ai/pipelineTypes');

      const enriched = await runPipeline('collection-enrichment', {
        scanResult,
        photoUrl,
        foundLocation: siteLocation,
        timestamp: new Date().toISOString(),
        userNotes
      });

      if (enriched.status === 'success') {
        // Save to Specimen entity
        await base44.entities.Specimen.create({
          mineral_name: enriched.findingRecord.name,
          common_name: topCandidate?.name || '',
          image_url: photoUrl || '',
          found_date: new Date().toISOString().split('T')[0],
          lat: siteLocation?.lat || null,
          lng: siteLocation?.lng || null,
          ai_confidence: topCandidate?.confidence || 0,
          notes: userNotes || '',
          rarity: 'common',
          verified: false
        });

        navigate('/collection', { state: { newFinding: enriched.findingRecord } });
      }
    } catch (error) {
      console.error('Error enriching finding:', error);
    } finally {
      setEnriching(false);
    }
  };

  const handleRetake = () => {
    navigate('/scan');
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Scan Result</h1>
        <button
          onClick={handleRetake}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white transition"
        >
          <RotateCcw size={14} /> Retake
        </button>
      </div>

      {/* Pipeline metadata */}
      {pipelineMeta && (
        <PipelineStatusPanel
          status="success"
          taskName={pipelineMeta.taskName}
          durationMs={pipelineMeta.durationMs}
        />
      )}

      <div className="mt-6 space-y-4">
        {/* Confidence breakdown */}
        <ConfidenceBreakdown
          topCandidate={topCandidate}
          candidates={candidates}
          source={scanResult.source}
        />

        {/* Match reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <GlassPanel className="p-5">
            <h3 className="text-sm font-bold text-white mb-3">Why This Match</h3>
            <ul className="space-y-2">
              {matchReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                  <span className="text-amethyst/40 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        )}

        {/* Similar minerals */}
        <SimilarMinerals candidates={candidates} topCandidateId={topCandidate?.mineralId} />

        {/* Recommended tests */}
        {recommendedTests && recommendedTests.length > 0 && (
          <GlassPanel className="p-5">
            <h3 className="text-sm font-bold text-white mb-3">Suggested Field Tests</h3>
            <ul className="space-y-2">
              {recommendedTests.map((test, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                  <span className="text-hud-cyan/40 mt-0.5">✓</span>
                  <span>{test}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        )}

        {/* Caution flags */}
        {cautionFlags && cautionFlags.length > 0 && (
          <GlassPanel className="p-5 border border-rose-500/20">
            <h3 className="text-sm font-bold text-rose-300 mb-3">Important</h3>
            <ul className="space-y-2">
              {cautionFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-rose-200/80">
                  <span className="mt-0.5">⚠</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        )}

        {/* Correction panel */}
        {showCorrection && <CorrectionPanel topCandidate={topCandidate} />}

        {!showCorrection && (
          <button
            onClick={() => setShowCorrection(true)}
            className="w-full py-2 text-xs text-white/50 hover:text-white/80 transition border-t border-white/10 mt-4"
          >
            Was this ID incorrect?
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-0 pb-4 bg-gradient-to-t from-black to-transparent pt-4">
          <button
            onClick={handleAddToCollection}
            disabled={enriching}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-amethyst-deep hover:bg-amethyst disabled:opacity-40 text-white font-bold text-base transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none"
          >
            <Plus size={16} /> {enriching ? 'Adding...' : 'Add to Collection'}
          </button>
          <button aria-label="Share scan result" className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-white/15 text-white/50 hover:text-white transition focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:outline-none">
            <Share2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}