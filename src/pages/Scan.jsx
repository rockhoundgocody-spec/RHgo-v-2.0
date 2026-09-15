import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { X, Zap, RefreshCw, Lock, Loader2, Image as ImageIcon } from 'lucide-react';
import useCameraStream from '@/components/scan/useCameraStream.jsx';
import ScanResultSheet from '@/components/scan/ScanResultSheet.jsx';
import RareMineralPopup from '@/components/scan/RareMineralPopup.jsx';
import BadgeUnlockOverlay from '@/components/badges/BadgeUnlockOverlay.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import { useSubscription } from '@/lib/useSubscription';
import { stripExif } from '@/lib/stripExif';
import { AGATE_PROMPT_BLOCK } from '@/lib/agateData';
import { applyGeoPrivacy, buildSpecimenNotes, calculateRarityQualityScore, calculateAwardedXp, countNearbyScans, PROVENANCE, LOCATION_SCAN_CAP } from '@/lib/scanSave';
import { deliberateGeologicalSpecimen, enrichWithScientificValidation } from '@/lib/agiGeologicalEngine';
import { scoreToBand } from '@/lib/reasoningEngine';
import { logCollectedWeight } from '@/components/hub/CollectionWeightTracker.jsx';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech.jsx';
import { progressQuestsForSpecimen } from '@/lib/questProgress';
import {
  consumeGuestScan,
  getGuestQuota,
  guestLoginUrl,
  stashPendingGuestReport,
} from '@/lib/guestDevice';

const VOICE_LINES = {
  high: (n) => `That's ${n}. I'm pretty sure about this one.`,
  medium: (n) => `I'm thinking ${n}, though a scratch test would settle it.`,
  low: () => "This one's tricky from the photo alone.",
  rare: (n) => `Oh wow — ${n}? That might actually be a rare one.`,
};

export default function Scan() {
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
  const [provenance, setProvenance] = useState(PROVENANCE.NATURE);
  const [recentSpecimens, setRecentSpecimens] = useState([]);
  const [locationExhausted, setLocationExhausted] = useState(false);

  const camera = useCameraStream({ active: stage === 'camera', facing });
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
  const canScan = !authReady
    ? false
    : isPaid || subLoading
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
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then(r => r.json())
          .then(d => {
            const a = d?.address;
            const name = a?.beach || a?.suburb || a?.city || a?.county || '';
            if (name) setBeachName(name);
          })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleShutter = async () => {
    if (!canScan) {
      if (isGuest) {
        setStage('guestLimit');
        return;
      }
      navigate('/pricing');
      return;
    }
    const blob = await camera.capture();
    if (!blob) return;

    const frameUrl = URL.createObjectURL(blob);
    setFrozenFrame(frameUrl);
    setLastShotUrl(frameUrl);
    setShowHint(false);
    setStage('processing');

    try {
      const clean = await stripExif(blob);
      const file = new File([clean], 'shot1.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const cutoutPromise = base44.functions
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
          'verification_tests (3-5 ranked by ease with expected outcome), image_quality_score (0-1), ' +
          'geological_plausibility (0-1), fun_fact, collection_value, rarity (common/uncommon/rare/legendary), ' +
          'and up to 3 ranked candidates. Never say "I cannot identify" — always give a best guess. ' +
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
            wet_dry: 'dry',
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
      console.error('Scan failed:', err);
      setStage('camera');
      setFrozenFrame(null);
    }
  };

  const handleSave = async (disposition) => {
    if (!result || !primaryUrl) return;
    if (isGuest) {
      // Soft save: stash locally, show confirmation — never hard-redirect to login
      stashPendingGuestReport({ result, primaryUrl, gpsCoords, beachName, disposition });
      setSheetOpen(false);
      setStage('guestSaved');
      setTimeout(resetToCamera, 2500);
      return;
    }
    setSheetOpen(false);

    const { lat, lng } = applyGeoPrivacy(gpsCoords, 'private');
    const rqs = calculateRarityQualityScore(result.rarity, result.confidence);
    const xp = disposition === 'left_in_place' ? 40 : disposition === 'observed' ? 15 : 25;

    const res = await base44.functions.invoke('identifySpecimen', {
      image_url: primaryUrl, lat, lng,
      save: true, share_to_map: false, geo_privacy: 'private',
      prefilled_result: result, wet_dry: 'dry', beach_name: beachName,
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
        geo_privacy: 'private',
        ...(lat != null ? { lat, lng } : {}),
      });
      specimenId = created.id;
    }

    await base44.entities.Specimen.update(specimenId, {
      disposition,
      collected: disposition === 'collected',
      left_in_place: disposition === 'left_in_place',
      legal_status: 'user_confirmed',
      ethics_prompt_shown: true,
      user_confirmed_legal_access: true,
      geo_privacy: 'private',
      rarity_quality_score: rqs,
      xp_awarded: xp,
    });

    setSavedId(specimenId);

    const currentUser = await base44.auth.me().catch(() => null);
    if (currentUser?.email) {
      const category = disposition === 'left_in_place' ? 'steward' : disposition === 'observed' ? 'explorer' : 'collector';
      const empty = { collector: 0, steward: 0, scientist: 0, explorer: 0, mentor: 0 };
      const profiles = await base44.entities.PlayerProfile.filter({ owner_email: currentUser.email });
      if (profiles[0]) {
        const cats = { ...empty, ...(profiles[0].xp_categories || {}) };
        cats[category] += xp;
        await base44.entities.PlayerProfile.update(profiles[0].id, {
          xp_categories: cats,
          total_xp: (profiles[0].total_xp || 0) + xp,
        });
      } else {
        await base44.entities.PlayerProfile.create({
          owner_email: currentUser.email, total_xp: xp,
          xp_categories: { ...empty, [category]: xp },
        });
      }
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

      {stage === 'camera' && showHint && (
        <div className="absolute inset-x-0 z-20 flex justify-center" style={{ bottom: '32%' }}>
          <span className="text-white/70 text-[12px] font-medium tracking-wide px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
            {camera.focusSupported ? 'Fill the frame · tap to focus' : 'Fill the frame · daylight'}
          </span>
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
            disabled={!camera.ready || !canScan}
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

      <ScanResultSheet
        open={sheetOpen}
        result={result}
        imageUrl={primaryUrl}
        saved={!!savedId}
        onKeep={() => handleSave('collected')}
        onLeave={() => handleSave('left_in_place')}
        onObserve={() => handleSave('observed')}
        onAsk={handleAsk}
        onRetry={resetToCamera}
        onClose={resetToCamera}
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
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center" style={{ background: '#0a0a14' }}>
          <p className="text-white/60 text-sm mb-4">Camera unavailable</p>
          <p className="text-white/30 text-xs mb-6 text-center px-8">{camera.error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#9FE8D0', color: '#0a0a14' }}>
            Go back
          </button>
        </div>
      )}
    </div>
  );
}