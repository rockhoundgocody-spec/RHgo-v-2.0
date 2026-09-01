import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { scoreToBand } from '@/lib/reasoningEngine';
import { deliberateGeologicalSpecimen, enrichWithScientificValidation } from '@/lib/agiGeologicalEngine';
import LiveScanStage from '@/components/scan/LiveScanStage.jsx';
import ReconstructionStage from '@/components/scan/ReconstructionStage.jsx';
import HolographicResult from '@/components/scan/HolographicResult.jsx';
import BadgeUnlockOverlay from '@/components/badges/BadgeUnlockOverlay.jsx';
import RareMineralPopup from '@/components/scan/RareMineralPopup.jsx';
import ShareToMapModal from '@/components/scan/ShareToMapModal.jsx';
import DiscoveryChoiceModal from '@/components/scan/DiscoveryChoiceModal.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import WetDryToggle from '@/components/scan/WetDryToggle.jsx';
import { logCollectedWeight } from '@/components/hub/CollectionWeightTracker.jsx';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech.jsx';
import { useSubscription } from '@/lib/useSubscription';
import { stripExif } from '@/lib/stripExif';
import { AGATE_PROMPT_BLOCK } from '@/lib/agateData';
import { applyGeoPrivacy, buildSpecimenNotes, calculateRarityQualityScore } from '@/lib/scanSave';

// Natural field-collector voice lines for each scan moment
const SCAN_LINES = {
  analyzing: [
    "Ooh, let me take a look at this one.",
    "Nice — give me just a second here.",
    "Hmm, interesting. Let me see what we've got.",
    "Oh, I like this one already. One sec.",
  ],
  result_high: (name) => [
    `Oh nice — that's ${name}. I'm pretty sure about this one.`,
    `Y'know, that looks like ${name} to me. The luster kind of gives it away.`,
    `That's ${name}, I'd say. Good eye finding that.`,
  ],
  result_medium: (name) => [
    `I'm thinking ${name}, though a little scratch test would settle it.`,
    `Probably ${name}? A streak test on a tile would tell us for sure, if you're curious.`,
    `Feels like ${name} to me — another angle might help me be sure, no rush.`,
  ],
  result_low: [
    "Hmm, this one's tricky from the photo alone. Maybe a different angle sometime?",
    "Hard to say, honestly — the lighting's making it tough. We can always try again.",
    "I can't quite make it out. Wiping it down might help if you feel like another go.",
  ],
  error: [
    "Hm, that one didn't quite come through. Want to try again?",
    "Oops, something hiccuped on my end. No worries — one more try?",
  ],
  rare: (name) => `Oh wow — ${name}? That might actually be a rare one. Worth remembering this spot.`,
};

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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
  const [rarePopup, setRarePopup] = useState(null); // { rarity, mineralName, badge }
  const [scanMode] = useState('rock');
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const { pendingBadge, dismissPending, refresh: refreshBadges } = useBadgeAwarder();
  const navigate = useNavigate();
  const { speak, stop } = useSpeechSynthesis();
  // Read voice preference set in HeroOrb / Settings
  const voiceEnabled = localStorage.getItem('rhgo_clover_voice') !== 'off';

  // Free-tier scan gating: 5 AI IDs/day; paid tiers unlimited.
  const [me, setMe] = useState(null);
  const { isPaid, loading: subLoading } = useSubscription(me);
  const FREE_SCAN_LIMIT = 5;
  const todayKey = `rhgo_scans_${new Date().toISOString().slice(0, 10)}`;
  const [scansUsed, setScansUsed] = useState(() => Number(localStorage.getItem(todayKey) || 0));
  const canScan = isPaid || subLoading || scansUsed < FREE_SCAN_LIMIT;
  const guardScan = () => {
    if (canScan) return true;
    navigate('/pricing');
    return false;
  };
  useEffect(() => { base44.auth.me().then(setMe).catch(() => {}); }, []);

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
    if (!guardScan()) return;
    const blob = file;
    setAngles([{ key: 'front', label: 'Uploaded', captured: true, blob }]);
    setStage('reconstruct');
    if (voiceEnabled) speak(pickRandom(SCAN_LINES.analyzing));
  };

  // Single-frame capture from the simplified LiveScanStage — one snap, one ID.
  const handleSingleCapture = (blob) => {
    if (!guardScan()) return;
    setAngles([{ key: 'front', label: 'Primary', captured: true, blob }]);
    setStage('reconstruct');
    if (voiceEnabled) speak(pickRandom(SCAN_LINES.analyzing));
  };

  // Pipeline runs once per `angles` set — we capture angles in a ref so the
  // runner identity is stable and ReconstructionStage's effect won't re-fire.
  const anglesRef = useRef(angles);
  anglesRef.current = angles;
  const gpsRef = useRef(gpsCoords);
  gpsRef.current = gpsCoords;
  const wetDryRef = useRef(wetDry);
  wetDryRef.current = wetDry;
  const beachRef = useRef(beachName);
  beachRef.current = beachName;
  const primaryRef = useRef(null);

  const runner = useCallback(async () => {
    const current = anglesRef.current;
    // Upload all blobs in parallel.
    const uploads = await Promise.all(
      current
        .filter((a) => a.blob)
        .map(async (a) => {
          // Re-encode first: drops EXIF GPS so a photo can never carry exact
          // find coordinates past the user's geo-privacy choice.
          const clean = await stripExif(a.blob);
          const file = new File([clean], `${a.key}.jpg`, { type: 'image/jpeg' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { ...a, file_url };
        })
    );

    const primary = uploads[0]?.file_url;
    primaryRef.current = primary;

    // Background removal — runs alongside identification. The AI still reads the
    // untouched originals; only the photo we show and save gets the cut-out.
    const cutoutPromise = base44.functions
      .invoke('removeSpecimenBackground', { image_url: primary })
      .then((res) => res?.data?.cutout_url || null)
      .catch(() => null);

    // AGI Multi-Agent Deliberative Reasoning Preparation
    const agiDeliberation = await deliberateGeologicalSpecimen({
      imageUrls: uploads.map((u) => u.file_url),
      locality: gpsRef.current,
      scanMode,
      userTier: isPaid ? 'pro' : 'free',
    });

    // Multi-image identification — explainable observational geology mode.
    const modeContext = {
      rock:    'The specimen is a bulk rock or hand specimen — focus on overall mineral composition, texture, and color.',
      crystal: 'The specimen is an individual crystal — focus on crystal habit, faces, terminations, and intergrowths.',
      fossil:  'The specimen may contain fossils or organic traces — look for imprints, replacement structures, and biological patterns.',
      matrix:  'The specimen is embedded in mixed host rock matrix — identify both the embedded mineral and the host rock.',
    };
    const r = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt:
        agiDeliberation.systemPrompt + '\n\n' +
        'You are an expert field geologist and mineralogist analyzing specimen photos. ' +
        `${modeContext[scanMode] || modeContext.rock} ` +
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
        'If image quality is poor, say so and still give your best attempt. Never say "I cannot identify" — always give a best guess with appropriate confidence. ' +
        AGATE_PROMPT_BLOCK +
        agiDeliberation.geologyContext,
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

    let resultData = r && typeof r === 'object' ? { ...r } : {};
    if (typeof r === 'string') {
      try { resultData = JSON.parse(r); } catch { resultData = {}; }
    }

    // Canonical enforcement pass — the backend applies the Operating Handbook,
    // Context Integrity grading, and Essence entropy math to this result
    // (prefilled_result skips the LLM, so this is fast and free).
    try {
      const veri = await base44.functions.invoke('identifySpecimen', {
        image_url: primary,
        lat: gpsRef.current?.lat,
        lng: gpsRef.current?.lng,
        save: false,
        prefilled_result: resultData,
        wet_dry: wetDryRef.current,
        beach_name: beachRef.current,
      });
      const d = veri?.data;
      if (d?.context_integrity) resultData.context_integrity = d.context_integrity;
      if (d?.handbook) resultData.handbook = d.handbook;
      if (d?.essence) resultData.essence = d.essence;
      if (typeof d?.identification?.confidence === 'number') resultData.confidence = d.identification.confidence;
    } catch { /* enforcement is best-effort — result still renders */ }

    // Build HRM-style reasoning result from the LLM output.
    const modelConf = typeof resultData?.confidence === 'number' ? resultData.confidence : 0.5;
    const imgEvidence = uploads.map((u, i) => ({
      type: 'image', label: i === 0 ? 'Primary photo' : `Angle ${i + 1}`, weight: 0.25,
    }));
    const featureEvidence = (resultData?.observed_features || []).slice(0, 5).map((f) => ({
      type: 'feature', label: f.feature, value: f.value, weight: 0.05,
    }));
    const combinedScore = Math.min(imgEvidence.length * 0.15 + modelConf * 0.7, 1);
    const band = scoreToBand(combinedScore);
    const hints = [];
    if (uploads.length === 1) hints.push('More angles improve accuracy');
    if (!resultData?.observed_features?.length) hints.push('Note color and luster for better results');

    const reasoningResult = {
      primaryResult: resultData?.top_match || 'Unknown',
      confidenceBand: band,
      confidenceScore: combinedScore,
      evidenceUsed: [...imgEvidence, ...featureEvidence],
      uncertainties: band === 'low' ? ['Low confidence — re-scan recommended'] : [],
      improvementHints: hints,
      recommendedAction: band === 'high' ? 'save' : band === 'medium' ? 'compare' : 'rescan',
      reasoningSummary: resultData?.reasoning || '',
      needsMoreEvidence: band === 'low',
      isOfflineFallback: false,
    };

    // Swap in the background-free cut-out for display + saving (best-effort)
    const cutoutUrl = await cutoutPromise;
    if (cutoutUrl) primaryRef.current = cutoutUrl;

    const enriched = enrichWithScientificValidation(resultData);

    return { result: enriched, uploads, reasoningResult };
  }, []);

  const handleDeepAnalysis = async () => {
    if (deepLoading || deepAnalysis) return;
    setDeepLoading(true);
    try {
      const res = await base44.functions.invoke('runDeepAnalysis', {
        image_url: primaryUrl,
        quick_result: result,
        lat: gpsCoords?.lat,
        lng: gpsCoords?.lng,
      });
      setDeepAnalysis(res?.data?.deep_analysis || null);
    } catch (err) {
      console.error('Deep analysis failed:', err);
    } finally {
      setDeepLoading(false);
    }
  };

  const handleReconstructed = ({ result: r, reasoningResult: rr }) => {
    setPrimaryUrl(primaryRef.current);
    setResult(r);
    setReasoningResult(rr || null);
    setDeepAnalysis(null);
    setDeepLoading(false);
    setStage('result');
    if (!isPaid) {
      setScansUsed(u => { const n = u + 1; localStorage.setItem(todayKey, String(n)); return n; });
    }

    // Clover speaks the result
    if (voiceEnabled && r?.top_match) {
      const band = rr?.confidenceBand || 'low';
      const name = r.top_match;
      const isRare = ['rare', 'legendary'].includes(r.rarity);
      // Rare minerals get a special excited line; otherwise use band-appropriate line
      const line = isRare
        ? SCAN_LINES.rare(name)
        : band === 'high'
          ? pickRandom(SCAN_LINES.result_high(name))
          : band === 'medium'
            ? pickRandom(SCAN_LINES.result_medium(name))
            : pickRandom(SCAN_LINES.result_low);
      // Small delay so result UI has time to render first
      setTimeout(() => speak(line), 600);
    }
  };

  const handleReconstructError = () => {
    // Soft fail back to live so the user can retry.
    if (voiceEnabled) speak(pickRandom(SCAN_LINES.error));
    setStage('live');
  };

  const saveWithChoice = async (choice) => {
    setChoiceOpen(false);
    if (!result || !primaryUrl) return;
    const { lat, lng } = applyGeoPrivacy(gpsCoords, choice.geoPrivacy);
    const rqs = calculateRarityQualityScore(result.rarity, result.confidence);
    const xp = choice.disposition === 'left_in_place' ? 40 : 25;
    // Route through the backend identifySpecimen function with save=true
    // so all rich metadata (scientific name, formula, hardness, formation, value) gets persisted
    const res = await base44.functions.invoke('identifySpecimen', {
      image_url: primaryUrl,
      lat,
      lng,
      save: true,
      share_to_map: false,
      geo_privacy: choice.geoPrivacy,
      prefilled_result: result,
      wet_dry: wetDry,
      beach_name: beachName,
    });
    // Backend may return saved_specimen_id; fall back to direct creation if needed
    let specimenId = res?.data?.saved_specimen_id;
    let specimenObj = null;
    if (!specimenId) {
      // Fallback: save directly with full metadata from result
      const created = await base44.entities.Specimen.create({
        mineral_name:  result.top_match,
        common_name:   result.scientific_name || result.top_match,
        image_url:     primaryUrl,
        ai_confidence: result.confidence,
        ai_candidates: result.candidates,
        notes:         buildSpecimenNotes(result),
        rarity:        result.rarity,
        found_date:    new Date().toISOString().split('T')[0],
        geo_privacy:   choice.geoPrivacy,
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
    const currentUser = await base44.auth.me().catch(() => null);
    if (currentUser?.email) {
      const category = choice.disposition === 'left_in_place' ? 'steward' : 'collector';
      const emptyCategories = { collector: 0, steward: 0, scientist: 0, explorer: 0, mentor: 0 };
      const profiles = await base44.entities.PlayerProfile.filter({ owner_email: currentUser.email });
      if (profiles[0]) {
        const categories = { ...emptyCategories, ...(profiles[0].xp_categories || {}) };
        categories[category] += xp;
        await base44.entities.PlayerProfile.update(profiles[0].id, {
          xp_categories: categories,
          total_xp: (profiles[0].total_xp || 0) + xp,
        });
      } else {
        await base44.entities.PlayerProfile.create({
          owner_email: currentUser.email,
          total_xp: xp,
          xp_categories: { ...emptyCategories, [category]: xp },
        });
      }

      if (choice.disposition === 'collected') logCollectedWeight(currentUser.email);
    }

    setSavedId(specimenId);
    setSavedSpecimen(specimenObj);

    // Trigger rare mineral popup for rare/legendary saves
    if (['rare', 'legendary'].includes(result.rarity)) {
      // Briefly wait for badge refresh so we can attach it to the popup
      await refreshBadges();
      setRarePopup({ rarity: result.rarity, mineralName: result.top_match });
    } else {
      refreshBadges();
    }
  };

  const reset = () => {
    stop();
    setStage('live');
    setAngles([]);
    setPrimaryUrl(null);
    setResult(null);
    setSavedId(null);
    setSavedSpecimen(null);
    setReasoningResult(null);
    setDeepAnalysis(null);
    setDeepLoading(false);
    setShareMapOpen(false);
    setChoiceOpen(false);
    setRarePopup(null);
    setWetDry('dry');
    setBeachName(null);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-3"
      style={{ height: '100dvh', paddingTop: 'max(env(safe-area-inset-top,0px), 8px)', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 72px)' }}>

      {/* Compact header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">AI Scanner</h1>
          <p className="text-white/55 text-[9px] uppercase tracking-[0.22em] mt-0.5">Point · Snap · Identify</p>
        </div>
        <div className="flex items-center gap-2">
          {(stage === 'live' || stage === 'capture') && (
            <WetDryToggle value={wetDry} onChange={setWetDry} />
          )}
          <StageStrip stage={stage} />
        </div>
      </div>

      {/* Main content — fills remaining height */}
      <div className="flex-1 min-h-0 overflow-y-auto -webkit-overflow-scrolling-touch">
        {stage === 'live' && (
          <LiveScanStage
            onCapture={handleSingleCapture}
            onUploadFallback={handleUploadFallback}
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
            onCompare={() => navigate('/compare', { state: { result, primaryImageUrl: primaryUrl } })}
            onShareMap={() => setShareMapOpen(true)}
            onDeepAnalysis={handleDeepAnalysis}
            deepAnalysis={deepAnalysis}
            deepLoading={deepLoading}
            gpsCoords={gpsCoords}
          />
        )}
      </div>

      {/* Rare mineral popup — overlays scan result as a bottom toast */}
      <AnimatePresence>
        {rarePopup && !pendingBadge && (
          <RareMineralPopup
            rarity={rarePopup.rarity}
            mineralName={rarePopup.mineralName}
            badge={null}
            onClose={() => setRarePopup(null)}
          />
        )}
      </AnimatePresence>

      {/* Full badge unlock cinematic — fires after rare popup clears */}
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
    { id: 'live', label: 'Scan' },
    { id: 'reconstruct', label: 'AI' },
    { id: 'result', label: 'Result' },
  ];
  const activeIdx = stages.findIndex((s) => s.id === stage);
  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s.id}>
            <div
              className="text-[7px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full"
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
                className="w-2 h-px"
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