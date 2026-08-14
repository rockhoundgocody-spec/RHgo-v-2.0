import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Camera, Upload, Loader2, Atom, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChronolithOpening from '@/components/chronolith/ChronolithOpening.jsx';
import RealityTrial from '@/components/chronolith/RealityTrial.jsx';

/**
 * CHRONOLITH — The Planet That Remembers
 *
 * Point a camera at matter. Watch reality explain how it became itself.
 *
 * Stages: capture → analyzing → opening → trial
 */
export default function Chronolith() {
  const [stage, setStage] = useState('capture');
  const [imageUrls, setImageUrls] = useState([]);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Auto-capture GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const uploadPromises = files.slice(0, 3).map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      });
      const urls = await Promise.all(uploadPromises);
      setImageUrls(urls);
      await runInvestigation(urls);
    } catch (err) {
      setError(err.message || 'Failed to upload images');
      setLoading(false);
    }
  };

  const runInvestigation = async (urls = imageUrls, existingObs = observations, caseId = null) => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('investigateCase', {
        image_urls: urls,
        lat: gpsCoords?.lat,
        lng: gpsCoords?.lng,
        field_observations: existingObs,
        specimen_label: '',
        case_id: caseId,
      });
      const newCase = res?.data?.case;
      if (!newCase) throw new Error('No case returned');
      setCaseData(newCase);
      if (stage === 'capture' || stage === 'analyzing') {
        setStage('opening');
      }
    } catch (err) {
      setError(err.message || 'Investigation failed');
      setStage('capture');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = async (newObs) => {
    const updated = [...observations, ...newObs];
    setObservations(updated);
    await runInvestigation(imageUrls, updated, caseData?.id);
  };

  const reset = () => {
    setStage('capture');
    setImageUrls([]);
    setCaseData(null);
    setObservations([]);
    setError('');
  };

  // ── CAPTURE STAGE ──
  if (stage === 'capture') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-10"
        style={{ minHeight: 'calc(100dvh - 72px)' }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Atom size={28} className="text-amethyst-glow" />
            <h1 className="text-2xl font-black text-white tracking-tight">CHRONOLITH</h1>
          </div>
          <p className="text-white/50 text-sm font-light italic max-w-xs mx-auto">
            The planet that remembers.
          </p>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] mt-2">
            Point a camera at matter
          </p>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full aspect-[4/5] rounded-3xl flex flex-col items-center justify-center gap-4 transition active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'radial-gradient(ellipse at center, hsla(270,50%,20%,0.3) 0%, hsla(220,40%,5%,0.6) 70%)',
              border: '1px dashed hsla(270,60%,60%,0.3)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={32} className="animate-spin text-amethyst-glow" />
                <p className="text-sm text-white/60">Interrogating reality…</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Nine agents are investigating</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'hsla(270,60%,30%,0.3)', border: '1px solid hsla(270,80%,60%,0.3)' }}>
                  <Camera size={24} className="text-amethyst-glow" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white/80">Begin a New Case</p>
                  <p className="text-xs text-white/40 mt-1">Photograph any rock, mineral, fossil,<br />meteorite, or unknown material</p>
                </div>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {/* GPS indicator */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-white/30">
            <MapPin size={10} />
            {gpsCoords ? `${gpsCoords.lat.toFixed(2)}, ${gpsCoords.lng.toFixed(2)}` : 'Acquiring GPS…'}
          </div>

          {/* How it works */}
          <div className="mt-6 p-4 rounded-2xl"
            style={{ background: 'hsla(220,40%,5%,0.5)', border: '1px solid hsla(270,20%,20%,0.2)' }}>
            <p className="text-xs text-white/50 leading-relaxed text-center">
              CHRONOLITH doesn't just identify objects. It constructs <span className="text-amethyst-glow">competing histories</span> of how they came to exist, attacks each for contradictions, and designs the test that eliminates the most uncertainty.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── OPENING CINEMATIC ──
  if (stage === 'opening' && caseData) {
    return (
      <ChronolithOpening
        caseData={caseData}
        imageUrl={imageUrls[0]}
        onEnter={() => setStage('trial')}
        onSkip={() => setStage('trial')}
      />
    );
  }

  // ── REALITY TRIAL ──
  if (stage === 'trial' && caseData) {
    return (
      <div className="px-4 py-3" style={{ minHeight: 'calc(100dvh - 72px)' }}>
        {/* Loading overlay during re-investigation */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 flex items-center justify-center"
              style={{ background: 'hsla(0,0%,0%,0.6)', backdropFilter: 'blur(4px)' }}
            >
              <div className="text-center">
                <Loader2 size={28} className="animate-spin text-amethyst-glow mx-auto mb-3" />
                <p className="text-sm text-white/60">Histories reorganizing…</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">The skeptic is reviewing</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <RealityTrial
          caseData={caseData}
          imageUrl={imageUrls[0]}
          onAddEvidence={handleAddEvidence}
          loading={loading}
          onReset={reset}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-full">
      <Button onClick={reset}>Start New Case</Button>
    </div>
  );
}