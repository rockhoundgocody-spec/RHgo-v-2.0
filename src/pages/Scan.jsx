import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { scoreToBand } from '@/lib/reasoningEngine';
import LiveScanStage from '@/components/scan/LiveScanStage.jsx';
import MultiAngleCapture from '@/components/scan/MultiAngleCapture.jsx';
import ReconstructionStage from '@/components/scan/ReconstructionStage.jsx';
import HolographicResult from '@/components/scan/HolographicResult.jsx';
import BadgeUnlockOverlay from '@/components/badges/BadgeUnlockOverlay.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import { useNavigate } from 'react-router-dom';

/**
 * Scan — combined flow:
 *   live  →  capture (multi-angle)  →  reconstruct (upload + AI)  →  result
 *
 * (Touched to force Vite to re-emit the chunk after sibling edits.)
 */
export default function Scan() {
  const [stage, setStage] = useState('live'); // live | capture | reconstruct | result
  const [angles, setAngles] = useState([]);
  const [primaryUrl, setPrimaryUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [reasoningResult, setReasoningResult] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const { pendingBadge, dismissPending, refresh: refreshBadges } = useBadgeAwarder();
  const navigate = useNavigate();

  // Auto-capture GPS as soon as the scan page loads
  React.useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently ignore if denied
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fallback if camera unavailable — single-image classic flow.
  const handleUploadFallback = async (file) => {
    if (!file) return;
    const blob = file;
    setAngles([{ key: 'front', label: 'Uploaded', captured: true, blob }]);
    setStage('reconstruct');
  };

  const handleCaptureComplete = (capturedAngles) => {
    setAngles(capturedAngles);
    setStage('reconstruct');
  };

  // Pipeline runs once per `angles` set — we capture angles in a ref so the
  // runner identity is stable and ReconstructionStage's effect won't re-fire.
  const anglesRef = useRef(angles);
  anglesRef.current = angles;
  const primaryRef = useRef(null);

  const runner = useCallback(async () => {
    const current = anglesRef.current;
    // Upload all blobs in parallel.
    const uploads = await Promise.all(
      current
        .filter((a) => a.blob)
        .map(async (a) => {
          const file = new File([a.blob], `${a.key}.jpg`, { type: 'image/jpeg' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { ...a, file_url };
        })
    );

    const primary = uploads[0]?.file_url;
    primaryRef.current = primary;

    // Multi-image identification — explainable observational geology mode.
    const r = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt:
        'You are an assisted geological observation system analyzing multiple photographs of the same specimen from different angles. ' +
        'Synthesize across views. Return: top_match (best mineral name), calibrated confidence (0-1, conservative), short description, ' +
        'reasoning (why top_match was chosen — color, luster, habit, fracture), observed_features (discrete {feature,value} pairs you actually see), ' +
        'lookalikes (minerals that resemble it + a one-line differentiator), verification_tests (hands-on tests with expected outcome), ' +
        'image_quality_score (0-1), geological_plausibility (0-1), and up to 3 ranked candidates each with confidence and a one-sentence rationale. ' +
        'Be honest about uncertainty — teach observational geology rather than overclaiming.',
      file_urls: uploads.map((u) => u.file_url),
      response_json_schema: {
        type: 'object',
        properties: {
          top_match: { type: 'string' },
          confidence: { type: 'number' },
          description: { type: 'string' },
          reasoning: { type: 'string' },
          image_quality_score: { type: 'number' },
          geological_plausibility: { type: 'number' },
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                confidence: { type: 'number' },
                features: { type: 'string' },
                rationale: { type: 'string' },
              },
            },
          },
          observed_features: {
            type: 'array',
            items: {
              type: 'object',
              properties: { feature: { type: 'string' }, value: { type: 'string' } },
            },
          },
          lookalikes: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, differentiator: { type: 'string' } },
            },
          },
          verification_tests: {
            type: 'array',
            items: {
              type: 'object',
              properties: { test: { type: 'string' }, expected: { type: 'string' } },
            },
          },
        },
      },
    });

    // Build HRM-style reasoning result from the LLM output.
    const modelConf = typeof r?.confidence === 'number' ? r.confidence : 0.5;
    const imgEvidence = uploads.map((u, i) => ({
      type: 'image', label: i === 0 ? 'Primary photo' : `Angle ${i + 1}`, weight: 0.25,
    }));
    const featureEvidence = (r?.observed_features || []).slice(0, 5).map((f) => ({
      type: 'feature', label: f.feature, value: f.value, weight: 0.05,
    }));
    const combinedScore = Math.min(imgEvidence.length * 0.15 + modelConf * 0.7, 1);
    const band = scoreToBand(combinedScore);
    const hints = [];
    if (uploads.length === 1) hints.push('More angles improve accuracy');
    if (!r?.observed_features?.length) hints.push('Note color and luster for better results');

    const reasoningResult = {
      primaryResult: r?.top_match || 'Unknown',
      confidenceBand: band,
      confidenceScore: combinedScore,
      evidenceUsed: [...imgEvidence, ...featureEvidence],
      uncertainties: band === 'low' ? ['Low confidence — re-scan recommended'] : [],
      improvementHints: hints,
      recommendedAction: band === 'high' ? 'save' : band === 'medium' ? 'compare' : 'rescan',
      reasoningSummary: r?.reasoning || '',
      needsMoreEvidence: band === 'low',
      isOfflineFallback: false,
    };

    return { result: r, uploads, reasoningResult };
  }, []);

  const handleReconstructed = ({ result: r, reasoningResult: rr }) => {
    setPrimaryUrl(primaryRef.current);
    setResult(r);
    setReasoningResult(rr || null);
    setStage('result');
  };

  const handleReconstructError = () => {
    // Soft fail back to live so the user can retry.
    setStage('live');
  };

  const saveToCollection = async (claimPath = 'chattel') => {
    if (!result || !primaryUrl) return;
    const created = await base44.entities.Specimen.create({
      mineral_name: result.top_match,
      common_name: result.top_match,
      image_url: primaryUrl,
      ai_confidence: result.confidence,
      ai_candidates: result.candidates,
      notes: result.description,
      found_date: new Date().toISOString().split('T')[0],
      ...(gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng } : {}),
    });
    setSavedId(created.id);
    refreshBadges();
  };

  const reset = () => {
    setStage('live');
    setAngles([]);
    setPrimaryUrl(null);
    setResult(null);
    setSavedId(null);
    setReasoningResult(null);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Scan</h1>
        <p className="text-white/35 text-[11px] uppercase tracking-[0.25em] mt-1">
          AI Vision · 3D Reconstruction
        </p>
        <StageStrip stage={stage} />
      </div>

      {stage === 'live' && (
        <LiveScanStage
          onBeginCapture={() => setStage('capture')}
          onUploadFallback={handleUploadFallback}
        />
      )}

      {stage === 'capture' && (
        <MultiAngleCapture
          onComplete={handleCaptureComplete}
          onCancel={() => setStage('live')}
        />
      )}

      {stage === 'reconstruct' && (
        <ReconstructionStage
          runner={runner}
          onDone={handleReconstructed}
          onError={handleReconstructError}
        />
      )}

      {stage === 'result' && result && (
        <HolographicResult
          primaryImageUrl={primaryUrl}
          result={result}
          reasoningResult={reasoningResult}
          saved={!!savedId}
          savedId={savedId}
          modelVersion="gemini-flash"
          onSave={saveToCollection}
          onReset={reset}
          onCompare={() =>
            navigate('/compare-live', {
              state: { scanImageUrl: primaryUrl, scanName: result.top_match },
            })
          }
        />
      )}

      {pendingBadge && (
        <BadgeUnlockOverlay badge={pendingBadge} onClose={dismissPending} />
      )}
    </div>
  );
}

function StageStrip({ stage }) {
  const stages = [
    { id: 'live', label: 'Vision' },
    { id: 'capture', label: 'Capture' },
    { id: 'reconstruct', label: 'Reconstruct' },
    { id: 'result', label: 'Hologram' },
  ];
  const activeIdx = stages.findIndex((s) => s.id === stage);
  return (
    <div className="mt-3 flex items-center justify-center gap-1.5">
      {stages.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s.id}>
            {/* eslint-disable-next-line */}
            <div
              className="text-[8px] font-mono uppercase tracking-[0.25em] px-2 py-0.5 rounded-full"
              style={{
                color: active
                  ? 'hsl(280 100% 85%)'
                  : done
                    ? 'hsl(145 80% 65%)'
                    : 'hsla(0,0%,100%,0.3)',
                background: active
                  ? 'hsla(280,80%,40%,0.2)'
                  : 'transparent',
                border: `1px solid ${active ? 'hsla(280,100%,70%,0.5)' : done ? 'hsla(145,80%,55%,0.4)' : 'hsla(0,0%,100%,0.1)'}`,
              }}
            >
              {s.label}
            </div>
            {i < stages.length - 1 && (
              <div
                className="w-3 h-px"
                style={{
                  background: i < activeIdx ? 'hsl(145 80% 55%)' : 'hsla(0,0%,100%,0.15)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}