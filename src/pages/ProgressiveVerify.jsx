import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import PsvPhotoStage from '@/components/psv/PsvPhotoStage.jsx';
import PsvDraftCard from '@/components/psv/PsvDraftCard.jsx';
import PsvQuestionCard from '@/components/psv/PsvQuestionCard.jsx';
import PsvFinalCard from '@/components/psv/PsvFinalCard.jsx';
import PsvDeltaLog from '@/components/psv/PsvDeltaLog.jsx';
import PsvProvenancePanel from '@/components/psv/PsvProvenancePanel.jsx';
import { Loader2 } from 'lucide-react';

export default function ProgressiveVerify() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('photo'); // photo | drafting | refining | finalising | done
  const [draft, setDraft] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [engine, setEngine] = useState(null);
  const [busy, setBusy] = useState(false);

  const handlePhotos = useCallback(async ({ imageUrls, lat, lng }) => {
    setBusy(true);
    setStage('drafting');
    const res = await base44.functions.invoke('progressiveVerify', {
      action: 'init', image_urls: imageUrls, lat, lng
    });
    setDraft(res.data.draft);
    if (res.data.engine) setEngine(res.data.engine);
    setBusy(false);
    setStage('refining');
  }, []);

  const handleAnswer = useCallback(async (key, text) => {
    if (!draft) return;
    setBusy(true);
    const res = await base44.functions.invoke('progressiveVerify', {
      action: 'refine', draft_id: draft.id, answer_key: key, answer_text: text
    });
    const updated = res.data.draft;
    setDraft(updated);
    if (res.data.engine) setEngine(res.data.engine);
    setBusy(false);
  }, [draft]);

  const handleFinalise = useCallback(async () => {
    if (!draft) return;
    setBusy(true);
    setStage('finalising');
    const res = await base44.functions.invoke('progressiveVerify', {
      action: 'finalise', draft_id: draft.id
    });
    setDraft(res.data.draft);
    setFinalResult(res.data.final);
    if (res.data.engine) setEngine(res.data.engine);
    setBusy(false);
    setStage('done');
  }, [draft]);

  const handleSave = useCallback(async () => {
    if (!draft || !finalResult) return;
    await base44.entities.Specimen.create({
      mineral_name: finalResult.primary_name,
      common_name: finalResult.primary_name,
      image_url: (draft.image_urls || [])[0] || '',
      ai_confidence: finalResult.confidence,
      notes: finalResult.collection_note,
      rarity: draft.rarity || 'common',
      found_date: new Date().toISOString().split('T')[0],
      lat: draft.lat ?? null,
      lng: draft.lng ?? null,
    });
    navigate('/collection');
  }, [draft, finalResult, navigate]);

  const confidencePct = draft ? Math.round(draft.confidence * 100) : 0;
  const revisions = draft?.revision ?? 0;

  return (
    <div className="px-4 pt-6 pb-28 max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Progressive Verification</h1>
        <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">
          Draft · Denoise · Verify · Finalise
        </p>
        <StageStrip stage={stage} />
      </div>

      {busy && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Loader2 className="animate-spin text-amethyst-glow" size={28} />
          <p className="text-amethyst/70 text-sm">
            {stage === 'drafting' && 'Generating initial draft…'}
            {stage === 'refining' && 'Denoising draft with new evidence…'}
            {stage === 'finalising' && 'Running 6 specialist reviewers…'}
          </p>
        </div>
      )}

      {!busy && (
        <>
          {stage === 'photo' && <PsvPhotoStage onReady={handlePhotos} />}

          {stage === 'refining' && draft && (
            <div className="space-y-4">
              <PsvDraftCard draft={draft} revisions={revisions} confidencePct={confidencePct} />
              {draft.next_question ? (
                <PsvQuestionCard
                  question={draft.next_question}
                  revisions={revisions}
                  onAnswer={handleAnswer}
                  onSkip={() => handleAnswer(draft.next_question.key, 'skip — not available in field')}
                />
              ) : (
                <button
                  onClick={handleFinalise}
                  className="w-full py-4 rounded-2xl bg-amethyst-deep hover:bg-amethyst border border-amethyst/40 text-white font-bold text-base transition"
                >
                  Run Final Multi-Agent Review →
                </button>
              )}
              {engine && <PsvProvenancePanel engine={engine} revision={revisions} />}
              {draft.delta_log?.length > 1 && <PsvDeltaLog log={draft.delta_log} />}
            </div>
          )}

          {stage === 'finalising' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="animate-spin text-amethyst-glow" size={28} />
              <p className="text-amethyst/70 text-sm">Multi-agent crossover in progress…</p>
              <p className="text-white/30 text-xs">Mineral ID · Lookalike · Field Test · Locality · Safety · Value</p>
            </div>
          )}

          {stage === 'done' && finalResult && (
            <div className="space-y-4">
              <PsvFinalCard result={finalResult} draft={draft} onSave={handleSave} onRescan={() => { setStage('photo'); setDraft(null); setFinalResult(null); setEngine(null); }} />
              {engine && <PsvProvenancePanel engine={engine} revision={revisions} />}
              {draft?.delta_log?.length > 0 && <PsvDeltaLog log={draft.delta_log} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StageStrip({ stage }) {
  const stages = [
    { id: 'photo', label: 'Photo' },
    { id: 'drafting', label: 'Draft' },
    { id: 'refining', label: 'Refine' },
    { id: 'finalising', label: 'Review' },
    { id: 'done', label: 'Result' },
  ];
  const order = ['photo', 'drafting', 'refining', 'finalising', 'done'];
  const activeIdx = order.indexOf(stage);
  return (
    <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
      {stages.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s.id}>
            <div
              className="text-[8px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
              style={{
                color: active ? 'hsl(280 100% 85%)' : done ? 'hsl(145 80% 65%)' : 'hsla(0,0%,100%,0.3)',
                background: active ? 'hsla(280,80%,40%,0.2)' : 'transparent',
                border: `1px solid ${active ? 'hsla(280,100%,70%,0.5)' : done ? 'hsla(145,80%,55%,0.4)' : 'hsla(0,0%,100%,0.1)'}`,
              }}
            >
              {s.label}
            </div>
            {i < stages.length - 1 && (
              <div className="w-2 h-px" style={{ background: i < activeIdx ? 'hsl(145 80% 55%)' : 'hsla(0,0%,100%,0.12)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}