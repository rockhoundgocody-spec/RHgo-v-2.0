import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { scoreToBand } from '@/lib/reasoningEngine';
import { fetchGeologyAt, formatGeologyContext } from '@/lib/macrostrat';
import LiveScanStage from '@/components/scan/LiveScanStage.jsx';
import MultiAngleCapture from '@/components/scan/MultiAngleCapture.jsx';
import ReconstructionStage from '@/components/scan/ReconstructionStage.jsx';
import HolographicResult from '@/components/scan/HolographicResult.jsx';
import BadgeUnlockOverlay from '@/components/badges/BadgeUnlockOverlay.jsx';
import ShareToMapModal from '@/components/scan/ShareToMapModal.jsx';
import DiscoveryChoiceModal from '@/components/scan/DiscoveryChoiceModal.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import { useNavigate } from 'react-router-dom';
import WetDryToggle from '@/components/scan/WetDryToggle.jsx';
import { logCollectedWeight } from '@/components/hub/CollectionWeightTracker.jsx';

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
  const [savedSpecimen, setSavedSpecimen] = useState(null);
  const [reasoningResult, setReasoningResult] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [wetDry, setWetDry] = useState('dry');
  const [beachName, setBeachName] = useState(null);
  const [shareMapOpen, setShareMapOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const { pendingBadge, dismissPending, refresh: refreshBadges } = useBadgeAwarder();
  const navigate = useNavigate();

  // Auto-capture GPS as soon as the scan page loads
  React.useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        // Reverse geocode to get beach name (for Great Lakes context)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then((r) => r.json())
          .then((d) => {
            const addr = d?.address;
            const name = addr?.beach || addr?.suburb || addr?.city || addr?.county || '';
            if (name) setBeachName(name);
          })
          .catch(() => {});
      },
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
  const gpsRef = useRef(gpsCoords);
  gpsRef.current = gpsCoords;
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

    // Local bedrock geology context (Macrostrat) — improves ID plausibility
    let geologyContext = '';
    if (gpsRef.current) {
      const units = await fetchGeologyAt(gpsRef.current.lat, gpsRef.current.lng).catch(() => []);
      geologyContext = formatGeologyContext(units);
    }

    // Multi-image identification — explainable observational geology mode.
    const r = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt:
        'You are an expert field geologist and mineralogist analyzing specimen photos. ' +
        'Study every visual detail carefully: crystal habit, surface luster (vitreous/metallic/pearly/resinous), ' +
        'transparency, color zoning, cleavage planes, fracture type, crystal system geometry, surface texture, ' +
        'any matrix rock present, and weathering patterns. ' +
        'Cross-reference multiple angles if provided — contradictions between angles are important clues. ' +
        'Return your best identification with: ' +
        'top_match (specific mineral name, not just rock type), ' +
        'scientific_name (full mineralogical name, e.g. Silicon Dioxide), ' +
        'chemical_formula (e.g. SiO₂), ' +
        'hardness_mohs (Mohs scale number or range), ' +
        'crystal_system (cubic/hexagonal/tetragonal/orthorhombic/monoclinic/triclinic/amorphous), ' +
        'formation (how this mineral forms geologically, 1-2 sentences), ' +
        'where_to_find (top 3 US states or global regions famous for this mineral), ' +
        'value_estimate (rough specimen value range, e.g. "$5-20 for typical specimens"), ' +
        'rarity (common/uncommon/rare/legendary based on specimen quality and mineral scarcity), ' +
        'confidence (0-1, calibrated — 0.9+ only if you are near-certain, be conservative), ' +
        'short engaging description (2 sentences, written for an excited young explorer, mention what makes THIS specimen special), ' +
        'reasoning (detailed: exactly what visual features led to this ID — be specific, e.g. "The hexagonal cross-section and vitreous luster on the prism faces, combined with the white streak..."), ' +
        'observed_features (array of discrete {feature, value} pairs you ACTUALLY see — e.g. {feature:"luster", value:"vitreous"}, {feature:"crystal_habit", value:"prismatic hexagonal"}, {feature:"color", value:"pale purple with color zoning"}), ' +
        'lookalikes (top 2-3 minerals it could be confused with, each with a single decisive differentiator test), ' +
        'verification_tests (3-5 hands-on field tests ranked by ease, with expected outcome for the top_match), ' +
        'image_quality_score (0-1), geological_plausibility (0-1), ' +
        'fun_fact (one surprising geological fact about this mineral — formation age, unusual property, famous deposit, cultural history), ' +
        'collection_value (brief note on what makes this specimen collectible or valuable — quality, locality, size, perfection), ' +
        'and up to 3 ranked candidates each with confidence, key distinguishing features, and one-sentence rationale. ' +
        'If image quality is poor, say so and still give your best attempt. Never say "I cannot identify" — always give a best guess with appropriate confidence.' +
        geologyContext,
      file_urls: uploads.map((u) => u.file_url),
      response_json_schema: {
        type: 'object',
        properties: {
          top_match:           { type: 'string' },
          scientific_name:     { type: 'string' },
          chemical_formula:    { type: 'string' },
          hardness_mohs:       { type: 'number' },
          crystal_system:      { type: 'string' },
          formation:           { type: 'string' },
          where_to_find:       { type: 'array', items: { type: 'string' } },
          value_estimate:      { type: 'string' },
          confidence:          { type: 'number' },
          description:         { type: 'string' },
          reasoning:           { type: 'string' },
          image_quality_score: { type: 'number' },
          geological_plausibility: { type: 'number' },
          rarity:              { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
          fun_fact:            { type: 'string' },
          collection_value:    { type: 'string' },
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

  const saveWithChoice = async (choice) => {
    setChoiceOpen(false);
    if (!result || !primaryUrl) return;
    // Geo privacy controls — exact, approximate (~1km), or private (no coords)
    let lat = gpsCoords?.lat ?? null;
    let lng = gpsCoords?.lng ?? null;
    if (choice.geoPrivacy === 'private') { lat = null; lng = null; }
    else if (choice.geoPrivacy === 'approximate' && lat != null) {
      lat = Math.round(lat * 100) / 100;
      lng = Math.round(lng * 100) / 100;
    }
    const rarityWeight = { common: 1, uncommon: 2, rare: 3, legendary: 5 }[result.rarity] || 1;
    const rqs = Math.round(rarityWeight * (result.confidence || 0.5) * 20);
    const xp = choice.disposition === 'left_in_place' ? 40 : 25;
    // Route through the backend identifySpecimen function with save=true
    // so all rich metadata (scientific name, formula, hardness, formation, value) gets persisted
    const res = await base44.functions.invoke('identifySpecimen', {
      image_url: primaryUrl,
      lat,
      lng,
      save: true,
      share_to_map: false,
      prefilled_result: result,
      wet_dry: wetDry,
      beach_name: beachName,
    });
    // Backend may return saved_specimen_id; fall back to direct creation if needed
    let specimenId = res?.data?.saved_specimen_id;
    let specimenObj = null;
    if (!specimenId) {
      // Fallback: save directly with full metadata from result
      const richNotes = [
        result.description,
        result.scientific_name ? `Scientific name: ${result.scientific_name}` : null,
        result.chemical_formula ? `Formula: ${result.chemical_formula}` : null,
        result.crystal_system ? `Crystal system: ${result.crystal_system}` : null,
        result.hardness_mohs != null ? `Hardness: ${result.hardness_mohs} Mohs` : null,
        result.formation ? `Formation: ${result.formation}` : null,
        result.value_estimate ? `Value: ${result.value_estimate}` : null,
        result.fun_fact ? `Fun fact: ${result.fun_fact}` : null,
      ].filter(Boolean).join('\n\n');
      const created = await base44.entities.Specimen.create({
        mineral_name:  result.top_match,
        common_name:   result.scientific_name || result.top_match,
        image_url:     primaryUrl,
        ai_confidence: result.confidence,
        ai_candidates: result.candidates,
        notes:         richNotes,
        rarity:        result.rarity,
        found_date:    new Date().toISOString().split('T')[0],
        ...(lat != null ? { lat, lng } : {}),
      });
      specimenId = created.id;
      specimenObj = created;
    } else {
      specimenObj = { id: specimenId, mineral_name: result.top_match, image_url: primaryUrl, ...result };
    }
    // Persist discovery-choice fields on the specimen
    await base44.entities.Specimen.update(specimenId, {
      disposition: choice.disposition,
      collected: choice.disposition === 'collected',
      left_in_place: choice.disposition === 'left_in_place',
      legal_status: 'user_confirmed',
      ethics_prompt_shown: true,
      user_confirmed_legal_access: true,
      geo_privacy: choice.geoPrivacy,
      rarity_quality_score: rqs,
      xp_awarded: xp,
    });

    // Award category XP — Collector for collecting, Steward for leaving in place
    const me = await base44.auth.me();
    const cat = choice.disposition === 'left_in_place' ? 'steward' : 'collector';
    const emptyCats = { collector: 0, steward: 0, scientist: 0, explorer: 0, mentor: 0 };
    const profs = await base44.entities.PlayerProfile.filter({ owner_email: me.email });
    if (profs[0]) {
      const cats = { ...emptyCats, ...(profs[0].xp_categories || {}) };
      cats[cat] += xp;
      await base44.entities.PlayerProfile.update(profs[0].id, {
        xp_categories: cats,
        total_xp: (profs[0].total_xp || 0) + xp,
      });
    } else {
      await base44.entities.PlayerProfile.create({
        owner_email: me.email,
        total_xp: xp,
        xp_categories: { ...emptyCats, [cat]: xp },
      });
    }

    // Track collected weight for Michigan legal limit
    if (choice.disposition === 'collected') {
      const me = await base44.auth.me().catch(() => null);
      if (me?.email) logCollectedWeight(me.email);
    }

    setSavedId(specimenId);
    setSavedSpecimen(specimenObj);
    refreshBadges();
    if (choice.geoPrivacy !== 'private') setTimeout(() => setShareMapOpen(true), 800);
  };

  const reset = () => {
    setStage('live');
    setAngles([]);
    setPrimaryUrl(null);
    setResult(null);
    setSavedId(null);
    setSavedSpecimen(null);
    setReasoningResult(null);
    setShareMapOpen(false);
    setChoiceOpen(false);
    setWetDry('dry');
    setBeachName(null);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Scan</h1>
        <p className="text-white/35 text-[11px] uppercase tracking-[0.25em] mt-1">
          AI Vision · 3D Reconstruction
        </p>
        <StageStrip stage={stage} />
        {/* Wet/Dry toggle — show on live and capture stages */}
        {(stage === 'live' || stage === 'capture') && (
          <div className="mt-3 flex justify-center">
            <WetDryToggle value={wetDry} onChange={setWetDry} />
          </div>
        )}
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
          onSave={() => setChoiceOpen(true)}
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

      <DiscoveryChoiceModal
        open={choiceOpen}
        mineralName={result?.top_match}
        onClose={() => setChoiceOpen(false)}
        onConfirm={saveWithChoice}
      />

      <ShareToMapModal
        open={shareMapOpen}
        specimen={savedSpecimen}
        result={result}
        onClose={() => setShareMapOpen(false)}
        onShared={() => setShareMapOpen(false)}
      />
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