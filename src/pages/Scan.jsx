import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { X, Zap, RefreshCw, Lock, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import useCameraStream from '@/components/scan/useCameraStream.jsx';
import ScanResultSheet from '@/components/scan/ScanResultSheet.jsx';
import WetDryToggle from '@/components/scan/WetDryToggle.jsx';
import { toast } from '@/components/ui/use-toast';
import RareMineralPopup from '@/components/scan/RareMineralPopup.jsx';
import BadgeUnlockOverlay from '@/components/badges/BadgeUnlockOverlay.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import { useSubscription } from '@/lib/useSubscription';
import { stripExif } from '@/lib/stripExif';
import { AGATE_PROMPT_BLOCK } from '@/lib/agateData';
import { applyGeoPrivacy, buildSpecimenNotes, calculateRarityQualityScore, calculateAwardedXp, countNearbyScans, PROVENANCE, LOCATION_SCAN_CAP } from '@/lib/scanSave';
import { reverseGeocode } from '@/components/scan/FoundLocationPicker.jsx';
import { persistLastGps } from '@/lib/geo';
import { trackEvent } from '@/lib/analytics';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';
import { deliberateGeologicalSpecimen, enrichWithScientificValidation } from '@/lib/agiGeologicalEngine';
import { scoreToBand } from '@/lib/reasoningEngine';
import { logCollectedWeight } from '@/components/hub/CollectionWeightTracker.jsx';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech.jsx';
import { progressQuestsForSpecimen } from '@/lib/questProgress';
import {
  consumeGuestScan,
  getGuestQuota,
  getOrCreateGuestId,
  stashPendingGuestReport,
} from '@/lib/guestDevice';

const VOICE_LINES = {
  high: (n) => `That's ${n}. I'm pretty sure about this one.`,
  medium: (n) => `I'm thinking ${n}, though a scratch test would settle it.`,
  low: () => "This one's tricky from the photo alone.",
  rare: (n) => `Oh wow — ${n}? That might actually be a rare one.`,
};

export default function Scan() {
  useSeoRobots(true);
  useSeoMeta(
    'Scan a rock free — AI mineral ID | RockHound-GO',
    'Photograph a specimen and get a field report with confidence, lookalikes, and tests. One free guest scan — no account required.',
  );
  const navigate = useNavigate();
  const [stage, setStage] = useState('camera');
  const [facing, setFacing] = useState('environment');
  const [frozenFrame, setFrozenFrame] = useState(null);
  const [lastShotUrl, setLastShotUrl] = useState(null);
  const [showHint, setShowHint] = useState(true);
  const [result, setResult] = useState(null);
  const [primaryUrl, setPrimaryUrl] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rarePopup, setRarePopup] = useState(null);
  const [torchHeld, setTorchHeld] = useState(false);
  const [torchWasOn, setTorchWasOn] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [beachName, setBeachName] = useState(null);
  const [foundLocation, setFoundLocation] = useState({ found_at: '', lat: null, lng: null });
  const [provenance, setProvenance] = useState(PROVENANCE.NATURE);
  const [wetDry, setWetDry] = useState('dry');
  const [recentSpecimens, setRecentSpecimens] = useState([]);
  const [locationExhausted, setLocationExhausted] = useState(false);

  const [cameraRetry, setCameraRetry] = useState(0);

  const camera = useCameraStream({ active: stage === 'camera', facing, retryKey: cameraRetry });
  const { pendingBadge, dismissPending, refresh: refreshBadges } = useBadgeAwarder();
  const { speak, stop } = useSpeechSynthesis();
  const voiceEnabled = localStorage.getItem('rhgo_clover_voice') !== 'off';

  const [me, setMe] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const { isPaid, loading: subLoading } = useSubscription(me);
  const monthKey = `rhgo_scans_${new Date().toISOString().slice(0, 7)}`;
  const [scansUsed, setScansUsed] = useState(() => Number(localStorage.getItem(monthKey) || 0));
  const [guestQuota, setGuestQuota] = useState(() => getGuestQuota());
  const isGuest = authReady && !me;
  const canScan = !authReady || subLoading
    ? false
    : isPaid
      ? true
      : isGuest
        ? guestQuota.allowed
        : scansUsed < 5;

  useEffect(() => {
    base44.auth.me()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        persistLastGps(coords);
        setGpsCoords(coords);
        const name = await reverseGeocode(coords.lat, coords.lng);
        if (name) setBeachName(name);
        setFoundLocation((prev) => {
          if (prev.source === 'picked') return prev;
          return { found_at: name || prev.found_at || '', lat: coords.lat, lng: coords.lng, source: 'gps' };
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!me?.email) return;
    base44.entities.Specimen.filter({ created_by: me.email }, '-found_date', 50)
      .then((rows) => {
        const list = rows || [];
        setRecentSpecimens(list);
        if (gpsCoords) setLocationExhausted(countNearbyScans(list, gpsCoords) >= LOCATION_SCAN_CAP);
      })
      .catch(() => {});
  }, [me?.email, gpsCoords]);

  const processPhoto = async (blob) => {
    const frameUrl = URL.createObjectURL(blob);
    setFrozenFrame(frameUrl);
    setLastShotUrl(frameUrl);
    setShowHint(false);
    setStage('processing');

    try {
      if (isGuest) {
        try {
          await base44.functions.invoke('guestScanGate', {
            guest_device_id: getOrCreateGuestId(),
            action: 'identify',
          });
        } catch (gateErr) {
          const status = gateErr?.status || gateErr?.data?.status || gateErr?.response?.status;
          if (status === 429 || /rate|guest|already used/i.test(String(gateErr?.message || gateErr?.data?.error || ''))) {
            setStage('guestLimit');
            return;
          }
          throw gateErr;
        }
      }

      const clean = await stripExif(blob);
      const file = new File([clean], 'shot1.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Guests skip cutout — removeSpecimenBackground requires auth (401 tax).
      const cutoutPromise = isGuest
        ? Promise.resolve(null)
        : base44.functions
            .invoke('removeSpecimenBackground', { image_url: file_url })
            .then(res => res?.data?.cutout_url || null)
            .catch(() => null);

      // Guest fast path: skip Macrostrat geology fetch for faster first value
      const agiDeliberation = isGuest
        ? { systemPrompt: 'You are an expert field geologist and mineralogist analyzing a specimen photo.', geologyContext: '' }
        : await deliberateGeologicalSpecimen({
            imageUrls: [file_url],
            locality: gpsCoords,
            scanMode: 'rock',
            userTier: isPaid ? 'pro' : 'free',
          });

      const r = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          agiDeliberation.systemPrompt + '\n\n' +
          'You are an expert field geologist and mineralogist analyzing a specimen photo. ' +
          'Study every visual detail: crystal habit, luster, transparency, color zoning, cleavage, fracture, ' +
          'crystal system geometry, surface texture, matrix rock, weathering. ' +
          'Return: top_match, scientific_name, chemical_formula, hardness_mohs, crystal_system, ' +
          'formation, where_to_find (array), value_estimate, confidence (0-1, conservative), ' +
          'description (2 sentences for an excited explorer), reasoning (what features led to this ID), ' +
          'observed_features (array of {feature, value} you ACTUALLY see), lookalikes (2-3 with differentiator), ' +
          'verification_tests (3-5 ranked by ease with expected outcome), ' +
          'field_habit (crystal habit/form you observe), field_luster (luster type), field_matrix (host rock), field_next_test (most useful next test to try), ' +
          'image_quality_score (0-1), ' +
          'geological_plausibility (0-1), fun_fact, collection_value, rarity (common/uncommon/rare/legendary), ' +
          'and up to 3 ranked candidates. Never say "I cannot identify" — always give a best guess. ' +
          'GPS is a prior, not a filter — glacial erratics, road gravel, and shop specimens appear out of bedrock. ' +
          'If visual ID conflicts with local geology, lower geological_plausibility and say so. ' +
          'Prefer common field stones over exotic gems unless diagnostics are strong. ' +
          'Calibrate confidence down for dark, cropped, wet-glare, or single-angle photos. ' +
          (wetDry === 'wet'
            ? 'CONDITION: specimen is WET — banding, coral patterns, and translucency are enhanced. '
            : 'CONDITION: specimen is DRY — patterns and luster may be muted. ') +
          AGATE_PROMPT_BLOCK + agiDeliberation.geologyContext,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            top_match: { type: 'string' },
            scientific_name: { type: 'string' },
            chemical_formula: { type: 'string' },
            hardness_mohs: { type: 'number' },
            crystal_system: { type: 'string' },
            formation: { type: 'string' },
            where_to_find: { type: 'array', items: { type: 'string' } },
            value_estimate: { type: 'string' },
            confidence: { type: 'number' },
            description: { type: 'string' },
            reasoning: { type: 'string' },
            image_quality_score: { type: 'number' },
            geological_plausibility: { type: 'number' },
            rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
            fun_fact: { type: 'string' },
            collection_value: { type: 'string' },
            candidates: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string' }, confidence: { type: 'number' }, features: { type: 'string' }, rationale: { type: 'string' } },
              },
            },
            observed_features: {
              type: 'array',
              items: { type: 'object', properties: { feature: { type: 'string' }, value: { type: 'string' } } },
            },
            lookalikes: {
              type: 'array',
              items: { type: 'object', properties: { name: { type: 'string' }, differentiator: { type: 'string' } } },
            },
            verification_tests: {
              type: 'array',
              items: { type: 'object', properties: { test: { type: 'string' }, expected: { type: 'string' } } },
            },
            field_habit: { type: 'string' },
            field_luster: { type: 'string' },
            field_matrix: { type: 'string' },
            field_next_test: { type: 'string' },
          },
        },
      });

      let resultData = r && typeof r === 'object' ? { ...r } : {};
      if (typeof r === 'string') { try { resultData = JSON.parse(r); } catch { resultData = {}; } }

      if (!isGuest) {
        try {
          const veri = await base44.functions.invoke('identifySpecimen', {
            image_url: file_url,
            lat: gpsCoords?.lat, lng: gpsCoords?.lng,
            save: false,
            prefilled_result: resultData,
            wet_dry: wetDry,
            beach_name: beachName,
          });
          const d = veri?.data;
          if (d?.context_integrity) resultData.context_integrity = d.context_integrity;
          if (d?.handbook) resultData.handbook = d.handbook;
          if (d?.essence) resultData.essence = d.essence;
          if (typeof d?.identification?.confidence === 'number') resultData.confidence = d.identification.confidence;
        } catch { /* best-effort */ }
      }

      const cutoutUrl = await cutoutPromise;
      const finalUrl = cutoutUrl || file_url;
      const enriched = enrichWithScientificValidation(resultData);

      setResult(enriched);
      setPrimaryUrl(finalUrl);
      setStage('result');
      setSheetOpen(true);
      trackEvent('scan_complete', {
        rarity: enriched?.rarity || 'unknown',
        confidence_band: (enriched?.confidence ?? 0) >= 0.85 ? 'high' : (enriched?.confidence ?? 0) >= 0.6 ? 'likely' : 'uncertain',
        guest: !!isGuest,
      });

      if (isGuest) {
        setGuestQuota(consumeGuestScan());
        stashPendingGuestReport({ result: enriched, primaryUrl: finalUrl, gpsCoords, beachName });
      } else if (!isPaid) {
        setScansUsed(u => { const n = u + 1; localStorage.setItem(monthKey, String(n)); return n; });
      }

      if (!isGuest && voiceEnabled && enriched?.top_match) {
        const band = scoreToBand(enriched.confidence || 0);
        const isRare = ['rare', 'legendary'].includes(enriched.rarity);
        const line = isRare
          ? VOICE_LINES.rare(enriched.top_match)
          : band === 'high' ? VOICE_LINES.high(enriched.top_match)
          : band === 'medium' ? VOICE_LINES.medium(enriched.top_match)
          : VOICE_LINES.low();
        setTimeout(() => speak(line), 600);
      }
    } catch (err) {
      toast({
        title: 'Scan failed',
        description: err?.message || 'Could not identify that photo. Try more light or another angle.',
        variant: 'destructive',
      });
      setStage('camera');
    }
  };

  const handleShutter = async () => {
    if (!canScan) {
      if (isGuest) {
        setStage('guestLimit');
        return;
      }
      setStage('freeLimit');
      return;
    }
    const blob = await camera.capture();
    if (!blob) return;
    await processPhoto(blob);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!canScan) {
      if (isGuest) {
        setStage('guestLimit');
        return;
      }
      setStage('freeLimit');
      return;
    }
    await processPhoto(file);
  };

  const handleSave = async (disposition, fieldReport, meta = {}) => {
    if (!result || !primaryUrl) return;
    if (disposition === 'collected' && !meta.legalConfirmed) {
      toast({
        title: 'Confirm legal access',
        description: 'Check “I can legally collect here” before Keep.',
        variant: 'destructive',
      });
      return;
    }
    if (isGuest) {
      // Soft save: stash locally, show confirmation — never hard-redirect to login
      stashPendingGuestReport({ result, primaryUrl, gpsCoords, beachName, foundLocation, disposition, fieldReport, legalConfirmed: !!meta.legalConfirmed });
      setSheetOpen(false);
      setStage('guestSaved');
      setTimeout(resetToCamera, 2500);
      return;
    }
    setSheetOpen(false);

    const place = foundLocation?.found_at || foundLocation?.lat != null
      ? foundLocation
      : { found_at: beachName, lat: gpsCoords?.lat, lng: gpsCoords?.lng, source: 'gps' };
    const pickedSpot = place.source === 'picked';
    const geoPrivacy = pickedSpot ? 'exact' : (place.lat != null ? 'approximate' : 'private');
    const { lat, lng } = applyGeoPrivacy(
      { lat: place.lat, lng: place.lng },
      geoPrivacy,
    );
    const rqs = calculateRarityQualityScore(result.rarity, result.confidence);
    const nearbyCount = countNearbyScans(recentSpecimens, { lat: place.lat, lng: place.lng });
    const xp = calculateAwardedXp({ disposition, provenance, nearbyCount });

    const res = await base44.functions.invoke('identifySpecimen', {
      image_url: primaryUrl, lat, lng,
      save: true, share_to_map: false, geo_privacy: geoPrivacy,
      prefilled_result: result, wet_dry: wetDry, beach_name: place.found_at || beachName,
      disposition,
    });

    let specimenId = res?.data?.saved_specimen_id;
    if (!specimenId) {
      const created = await base44.entities.Specimen.create({
        mineral_name: result.top_match,
        common_name: result.scientific_name || result.top_match,
        image_url: primaryUrl,
        ai_confidence: result.confidence,
        ai_candidates: result.candidates,
        notes: buildSpecimenNotes(result),
        rarity: result.rarity,
        found_date: new Date().toISOString().split('T')[0],
        found_at: place.found_at || beachName || null,
        provenance,
        geo_privacy: geoPrivacy,
        ...(lat != null ? { lat, lng } : {}),
      });
      specimenId = created.id;
    }

    await base44.entities.Specimen.update(specimenId, {
      disposition,
      collected: disposition === 'collected',
      left_in_place: disposition === 'left_in_place',
      legal_status: disposition === 'collected'
        ? (meta.legalConfirmed ? 'user_confirmed' : 'pending_user')
        : 'not_collected',
      ethics_prompt_shown: true,
      user_confirmed_legal_access: disposition === 'collected' && !!meta.legalConfirmed,
      found_at: place.found_at || beachName || null,
      provenance,
      geo_privacy: geoPrivacy,
      rarity_quality_score: rqs,
      xp_awarded: xp,
      ...(lat != null ? { lat, lng } : {}),
      ...(fieldReport?.field_habit ? { field_habit: fieldReport.field_habit } : {}),
      ...(fieldReport?.field_luster ? { field_luster: fieldReport.field_luster } : {}),
      ...(fieldReport?.field_matrix ? { field_matrix: fieldReport.field_matrix } : {}),
      ...(fieldReport?.field_next_test ? { field_next_test: fieldReport.field_next_test } : {}),
    });

    setSavedId(specimenId);
    trackEvent('scan_save', { disposition, guest: false });

    const currentUser = await base44.auth.me().catch(() => null);
    if (currentUser?.email) {
      const category = disposition === 'left_in_place' ? 'steward' : disposition === 'observed' ? 'explorer' : 'collector';
      const empty = { collector: 0, steward: 0, scientist: 0, explorer: 0, mentor: 0 };
      try {
        // If identifySpecimen didn't save (fallback path), award XP server-side
        if (!res?.data?.saved_specimen_id) {
          await base44.functions.invoke('awardVerifiedXP', {
            event_type: 'specimen', event_id: specimenId, disposition,
          });
        }
      } catch { /* best-effort */ }
      try {
        const profiles = await base44.entities.PlayerProfile.filter({ owner_email: currentUser.email });
        if (profiles[0]) {
          const cats = { ...empty, ...(profiles[0].xp_categories || {}) };
          cats[category] = (cats[category] || 0) + xp;
          // Categories only — awardXP owns total_xp
          await base44.entities.PlayerProfile.update(profiles[0].id, {
            xp_categories: cats,
          });
        }
      } catch { /* best-effort */ }
      if (disposition === 'collected') logCollectedWeight(currentUser.email);
      try {
        await progressQuestsForSpecimen(
          { ...result, id: specimenId, image_url: primaryUrl },
          currentUser.email
        );
      } catch { /* best-effort */ }
    }

    if (['rare', 'legendary'].includes(result.rarity)) {
      await refreshBadges();
      setRarePopup({ rarity: result.rarity, mineralName: result.top_match });
    } else {
      refreshBadges();
    }
  };

  const handleAsk = () => {
    setSheetOpen(false);
    navigate('/companion');
  };

  const resetToCamera = () => {
    stop();
    setStage('camera');
    setFrozenFrame(null);
    setResult(null);
    setSavedId(null);
    setSheetOpen(false);
  };

  const handleLockDown = async () => {
    if (!camera.torchSupported) return;
    setTorchWasOn(camera.torchOn);
    setTorchHeld(true);
    if (!camera.torchOn) await camera.toggleTorch();
  };
  const handleLockUp = async () => {
    setTorchHeld(false);
    if (!torchWasOn && camera.torchOn) await camera.toggleTorch();
  };

  const flipCamera = () => setFacing(f => f === 'environment' ? 'user' : 'environment');

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: '#0a0a14' }}>
      {stage === 'camera' && (
        <video
          ref={camera.videoRef}
          playsInline
          muted
          autoPlay
          onClick={(e) => camera.focusAt?.(e.clientX, e.clientY, e.currentTarget)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
        />
      )}

      {(stage === 'processing' || stage === 'result') && frozenFrame && (
        <img src={frozenFrame} alt="capture" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {stage === 'camera' && (
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4"
          style={{ paddingTop: 'max(env(safe-area-inset-top,0px), 12px)' }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Close camera"
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          >
            <X size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            {camera.torchSupported && (
              <button
                onClick={camera.toggleTorch}
                aria-label="Flash"
                className="w-11 h-11 rounded-full flex items-center justify-center transition active:scale-90"
                style={{
                  background: camera.torchOn ? 'rgba(159,232,208,0.25)' : 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Zap size={18} style={{ color: camera.torchOn ? '#9FE8D0' : '#fff' }} fill={camera.torchOn ? '#9FE8D0' : 'none'} />
              </button>
            )}
            <button
              onClick={flipCamera}
              aria-label="Flip camera"
              className="w-11 h-11 rounded-full flex items-center justify-center transition active:scale-90"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            >
              <RefreshCw size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {stage === 'camera' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl" style={{ width: '62%', aspectRatio: '1 / 1', border: '1.5px solid rgba(255,255,255,0.35)', boxShadow: '0 0 0 1px rgba(0,0,0,0.3)' }} />
        </div>
      )}

      {stage === 'camera' && camera.focusPoint && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${camera.focusPoint.x * 100}%`,
            top: `${camera.focusPoint.y * 100}%`,
            width: '80px', height: '80px',
            transform: 'translate(-50%, -50%)',
            border: '2px solid #9FE8D0',
            borderRadius: '12px',
            boxShadow: '0 0 12px rgba(159,232,208,0.5)',
            animation: 'focusPulse 0.3s ease-out',
          }}
        />
      )}

      {stage === 'camera' && (
        <div className="absolute inset-x-0 z-20 flex flex-col items-center gap-3 pointer-events-auto" style={{ bottom: '30%' }}>
          <WetDryToggle value={wetDry} onChange={setWetDry} />
          {showHint && (
            <span className="text-white/70 text-[12px] font-medium tracking-wide px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
              {camera.focusSupported ? 'Fill the frame · tap to focus' : 'Fill the frame · daylight'}
            </span>
          )}
        </div>
      )}

      {stage === 'processing' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center" style={{ background: 'rgba(10,10,20,0.6)' }}>
          <Loader2 size={36} className="text-[#9FE8D0] animate-spin" />
          <p className="text-white/70 text-[12px] mt-3 uppercase tracking-[0.2em]">Identifying…</p>
        </div>
      )}

      {stage === 'guestSaved' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center" style={{ background: 'rgba(10,10,20,0.92)' }}>
          <div className="text-center px-8">
            <p className="text-white font-bold text-lg mb-2">Saved on this device</p>
            <p className="text-white/50 text-sm">Create a free account to sync your finds to the cloud.</p>
          </div>
        </div>
      )}

      {stage === 'guestLimit' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8" style={{ background: '#0a0a14' }}>
          <p className="text-white font-bold text-lg mb-2">That was your free scan</p>
          <p className="text-white/50 text-sm text-center mb-6">Create a free account for 5 scans every month — no card needed.</p>
          <button onClick={() => navigate('/register')} className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: '#9FE8D0', color: '#0a0a14' }}>
            Create free account
          </button>
          <button onClick={resetToCamera} className="text-white/40 text-sm mt-3">Not now</button>
        </div>
      )}

      {stage === 'freeLimit' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8" style={{ background: '#0a0a14' }}>
          <p className="text-white font-bold text-lg mb-2">You've used this month's free scans</p>
          <p className="text-white/50 text-sm text-center mb-6">Keep exploring the map — upgrade when you're ready for more scans.</p>
          <button onClick={resetToCamera} className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: '#9FE8D0', color: '#0a0a14' }}>
            Keep exploring
          </button>
          <button onClick={() => navigate('/pricing')} className="text-white/40 text-sm mt-3">See Premium</button>
        </div>
      )}

      {stage === 'camera' && (
        <div className="absolute bottom-0 inset-x-0 z-30 flex items-center justify-between px-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom,0px), 24px)', marginBottom: '8px' }}>
          <div className="w-14 flex justify-center">
            {lastShotUrl ? (
              <img src={lastShotUrl} alt="last" className="w-12 h-12 rounded-xl object-cover border border-white/20" />
            ) : (
              <div className="w-12 h-12 rounded-xl border border-white/15 flex items-center justify-center">
                <ImageIcon size={16} className="text-white/20" />
              </div>
            )}
          </div>

          <button
            onClick={handleShutter}
            disabled={!camera.ready || (isGuest && !canScan)}
            aria-label="Capture"
            className="rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
            style={{ width: 72, height: 72, background: '#9FE8D0', boxShadow: '0 0 30px -4px rgba(159,232,208,0.6)' }}
          >
            <div className="w-14 h-14 rounded-full" style={{ border: '3px solid #0a0a14' }} />
          </button>

          <div className="w-14 flex justify-center">
            {camera.torchSupported && (
              <button
                onPointerDown={handleLockDown}
                onPointerUp={handleLockUp}
                onPointerLeave={handleLockUp}
                aria-label="Hold for light"
                className="w-12 h-12 rounded-xl flex items-center justify-center transition active:scale-90"
                style={{
                  background: (torchHeld || camera.torchOn) ? 'rgba(159,232,208,0.25)' : 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Lock size={18} style={{ color: (torchHeld || camera.torchOn) ? '#9FE8D0' : '#fff' }} />
              </button>
            )}
          </div>
        </div>
      )}

      {stage === 'camera' && !camera.error && (
        <div className="absolute inset-x-0 z-20 flex justify-center" style={{ bottom: 'calc(max(env(safe-area-inset-bottom,0px), 24px) + 88px)' }}>
          <label className="text-white/40 text-[11px] font-medium hover:text-white/60 transition cursor-pointer focus-within:ring-2 focus-within:ring-[#9FE8D0] focus-within:outline-none rounded">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="sr-only"
            />
            or upload a photo
          </label>
        </div>
      )}

      <ScanResultSheet
        open={sheetOpen}
        result={result}
        imageUrl={primaryUrl}
        saved={!!savedId}
        onKeep={(fr, meta) => handleSave('collected', fr, meta)}
        onLeave={(fr, meta) => handleSave('left_in_place', fr, meta)}
        onObserve={(fr, meta) => handleSave('observed', fr, meta)}
        onAsk={handleAsk}
        onRetry={resetToCamera}
        onClose={resetToCamera}
        provenance={provenance}
        onProvenanceChange={setProvenance}
        locationExhausted={locationExhausted}
        foundLocation={foundLocation}
        onFoundLocationChange={setFoundLocation}
      />

      <AnimatePresence>
        {rarePopup && !pendingBadge && (
          <RareMineralPopup
            rarity={rarePopup.rarity}
            mineralName={rarePopup.mineralName}
            badge={null}
            onClose={() => { setRarePopup(null); resetToCamera(); }}
          />
        )}
      </AnimatePresence>

      {pendingBadge && (
        <BadgeUnlockOverlay badge={pendingBadge} onClose={() => { dismissPending(); resetToCamera(); }} />
      )}

      {camera.error && stage === 'camera' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8" style={{ background: '#0a0a14' }}>
          <p className="text-white/60 text-sm mb-2">Camera unavailable</p>
          <p className="text-white/30 text-xs mb-6 text-center">{camera.error}</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <label className="px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-white/50 focus-within:outline-none" style={{ background: '#9FE8D0', color: '#0a0a14' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="sr-only"
              />
              <Upload size={16} /> Upload from gallery
            </label>
            <button onClick={() => setCameraRetry(k => k + 1)} className="px-6 py-3 rounded-xl text-sm font-semibold text-white/70" style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.12)' }}>
              Try camera again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}