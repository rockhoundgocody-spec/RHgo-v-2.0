import React, { useEffect, useRef, useState, useCallback } from 'react';
import useCameraStream from './useCameraStream';
import ScanReticle from './ScanReticle.jsx';
import LiveLabelsOverlay from './LiveLabelsOverlay.jsx';
import { Upload, ScanLine, Gem, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STAGE_LABELS = {
  idle:       { text: 'Point at a specimen',    sub: 'Hold camera steady' },
  scanning:   { text: 'Specimen detected',      sub: 'Analyzing frame…'   },
  processing: { text: 'AI running',             sub: 'Building identifier' },
  locked:     { text: 'Target locked',          sub: 'Ready to deep scan' },
};

export default function LiveScanStage({ onBeginCapture, onUploadFallback }) {
  const { videoRef, ready, error } = useCameraStream({ active: true });
  const [signal, setSignal] = useState(0);
  const [scanState, setScanState] = useState('idle'); // idle | scanning | processing | locked
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastLabel, setLastLabel] = useState(null);
  const fileRef = useRef(null);
  const signalRef = useRef(0);
  const scanStateRef = useRef('idle');

  // Simulate signal build-up while camera is ready
  useEffect(() => {
    if (!ready) return;
    let raf;
    let t = 0;
    const tick = () => {
      t += 0.016;
      const target = 0.45 + Math.sin(t * 0.5) * 0.3 + Math.sin(t * 1.3) * 0.15;
      const next = signalRef.current + (target - signalRef.current) * 0.03;
      signalRef.current = next;
      setSignal(next);

      // Drive scan state from signal
      const newState = next > 0.78 ? 'locked' : next > 0.55 ? 'scanning' : 'idle';
      if (newState !== scanStateRef.current) {
        scanStateRef.current = newState;
        setScanState(newState);
        if (newState === 'locked' && typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([20, 60, 20]); } catch {}
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // When AI classify call starts/ends, flip to processing state
  const handleProcessingStart = useCallback(() => {
    setIsProcessing(true);
    setScanState('processing');
    scanStateRef.current = 'processing';
  }, []);

  const handleProcessingEnd = useCallback((label) => {
    setIsProcessing(false);
    setLastLabel(label || null);
    // Return to signal-driven state
    const sig = signalRef.current;
    const next = sig > 0.78 ? 'locked' : sig > 0.55 ? 'scanning' : 'idle';
    setScanState(next);
    scanStateRef.current = next;
  }, []);

  const stageInfo = STAGE_LABELS[scanState] || STAGE_LABELS.idle;

  const STATE_COLORS = {
    idle:       { accent: 'hsla(280,80%,65%,0.85)',  border: 'hsla(280,60%,45%,0.35)', bar: 'hsl(280,80%,60%)' },
    scanning:   { accent: 'hsla(280,100%,80%,0.9)',  border: 'hsla(280,90%,60%,0.5)',  bar: 'hsl(280,100%,75%)' },
    processing: { accent: 'hsla(195,100%,70%,0.9)',  border: 'hsla(195,100%,55%,0.55)', bar: 'hsl(195,100%,65%)' },
    locked:     { accent: 'hsla(145,80%,60%,0.9)',   border: 'hsla(145,80%,50%,0.5)',  bar: 'hsl(145,80%,55%)' },
  };
  const col = STATE_COLORS[scanState] || STATE_COLORS.idle;

  return (
    <div className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'hsla(265,40%,3%,0.98)',
        border: `1px solid ${col.border}`,
        boxShadow: `0 0 60px -10px ${col.accent.replace('0.9', '0.25')}, 0 0 0 1px ${col.border}`,
        transition: 'border-color 0.5s, box-shadow 0.5s',
      }}>

      {/* ── STATUS HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${col.border}`, background: 'hsla(265,50%,4%,0.7)', transition: 'border-color 0.5s' }}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-2 h-2">
            <span className="absolute inset-0 rounded-full animate-ping"
              style={{ background: col.accent, opacity: 0.5, animationDuration: scanState === 'processing' ? '0.7s' : '1.5s' }} />
            <span className="relative rounded-full w-2 h-2 block"
              style={{ background: col.accent }} />
          </div>
          <div>
            <div className="text-[11px] font-semibold leading-tight" style={{ color: col.accent, transition: 'color 0.4s' }}>
              {stageInfo.text}
            </div>
            <div className="text-[9px] text-white/35 uppercase tracking-[0.2em]">{stageInfo.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Gem size={11} style={{ color: col.accent, filter: `drop-shadow(0 0 6px ${col.accent})`, transition: 'color 0.4s' }} />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">RockHound·AI</span>
        </div>
      </div>

      {/* ── MAIN VIEWPORT ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>

        {error ? (
          <ErrorView error={error} fileRef={fileRef} onUploadFallback={onUploadFallback} />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

            {/* Dark vignette */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, transparent 38%, hsla(265,60%,3%,0.75) 100%)' }} />

            {/* Color wash tinted by state */}
            <div className="absolute inset-0 pointer-events-none mix-blend-color-dodge"
              style={{
                background: scanState === 'processing'
                  ? 'radial-gradient(ellipse at 50% 50%, hsla(195,100%,40%,0.08) 0%, transparent 65%)'
                  : scanState === 'locked'
                    ? 'radial-gradient(ellipse at 50% 50%, hsla(145,80%,30%,0.06) 0%, transparent 65%)'
                    : 'radial-gradient(ellipse at 50% 50%, hsla(280,80%,30%,0.07) 0%, transparent 65%)',
                transition: 'background 0.6s',
              }} />

            {/* Subtle grid */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `linear-gradient(${col.accent.replace('0.85', '0.3')} 1px, transparent 1px), linear-gradient(90deg, ${col.accent.replace('0.85', '0.3')} 1px, transparent 1px)`,
                backgroundSize: '52px 52px',
                transition: 'opacity 0.4s',
              }} />

            {/* Scan sweep line — faster when processing */}
            <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-x-0 h-20"
                style={{
                  background: `linear-gradient(180deg, transparent, ${col.accent.replace('0.85', '0.15')}, transparent)`,
                  animation: `hud-scan ${scanState === 'processing' ? '1.2s' : '2.5s'} linear infinite`,
                }} />
            </div>

            {/* RETICLE — centered */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <ScanReticle state={scanState} signal={signal} size={200} />
            </div>

            {/* Live identification labels */}
            <LiveLabelsOverlay
              videoRef={videoRef}
              active={ready && !isProcessing}
              onProcessingStart={handleProcessingStart}
              onProcessingEnd={handleProcessingEnd}
            />

            {/* Last detected label — persists between classify calls */}
            {lastLabel && !isProcessing && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full z-10"
                style={{
                  background: 'hsla(220,40%,5%,0.85)',
                  border: `1px solid ${col.border}`,
                  backdropFilter: 'blur(8px)',
                }}>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: col.accent }}>
                  {lastLabel}
                </span>
              </div>
            )}

            {/* Processing flash overlay */}
            {scanState === 'processing' && (
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, hsla(195,100%,60%,0.04) 0%, transparent 60%)',
                  animation: 'pp-breath 0.9s ease-in-out infinite',
                }} />
            )}

            {/* Corner brackets */}
            <CornerBrackets color={col.accent} />

            {/* Bottom telemetry */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-3 pt-8 pointer-events-none"
              style={{ background: 'linear-gradient(0deg, hsla(265,60%,3%,0.9) 0%, transparent 100%)' }}>
              <SignalBar value={signal} color={col.bar} state={scanState} />
            </div>
          </>
        )}
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      {!error && (
        <div className="p-4 space-y-2.5"
          style={{ borderTop: `1px solid ${col.border}`, background: 'hsla(265,50%,3%,0.8)', transition: 'border-color 0.5s' }}>

          <Button onClick={onBeginCapture} disabled={!ready}
            className="w-full h-14 rounded-xl text-sm font-bold uppercase tracking-[0.18em] text-white disabled:opacity-35"
            style={{
              background: ready
                ? `linear-gradient(135deg, hsla(270,80%,38%,0.95) 0%, hsla(280,100%,52%,0.8) 100%)`
                : 'hsla(270,40%,18%,0.4)',
              border: `1px solid ${col.border}`,
              boxShadow: ready ? `0 0 28px ${col.accent.replace('0.85', '0.25')}, inset 0 1px 0 hsla(280,100%,90%,0.08)` : 'none',
              transition: 'all 0.4s',
            }}>
            <ScanLine size={18} className="mr-2.5" />
            {ready ? (scanState === 'locked' ? 'Deep Scan Specimen' : 'Scan Mineral') : 'Initializing…'}
          </Button>

          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35 hover:text-white/60 transition-colors"
            style={{ border: '1px solid hsla(280,30%,25%,0.3)' }}>
            <Upload size={13} />
            Upload from Gallery
          </button>

          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => onUploadFallback?.(e.target.files?.[0])} />
        </div>
      )}
    </div>
  );
}

/* ── Signal bar ── */
function SignalBar({ value, color, state }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.25em] text-white/30">
        <span>{state === 'processing' ? '⬟ AI Processing…' : state === 'locked' ? '⬟ Locked on target' : '⬞ Align specimen'}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

/* ── Corner brackets ── */
function CornerBrackets({ color }) {
  const s = { border: `2px solid ${color}`, filter: `drop-shadow(0 0 5px ${color})`, width: 20, height: 20 };
  return (
    <>
      <div className="absolute top-4 left-4 pointer-events-none" style={{ ...s, borderRight: 'none', borderBottom: 'none', borderRadius: '3px 0 0 0' }} />
      <div className="absolute top-4 right-4 pointer-events-none" style={{ ...s, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 3px 0 0' }} />
      <div className="absolute bottom-[68px] left-4 pointer-events-none" style={{ ...s, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 3px' }} />
      <div className="absolute bottom-[68px] right-4 pointer-events-none" style={{ ...s, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 3px 0' }} />
    </>
  );
}

/* ── Error fallback ── */
function ErrorView({ error, fileRef, onUploadFallback }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
      style={{ background: 'hsla(265,50%,3%,0.97)' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'hsla(280,60%,18%,0.5)', border: '1px solid hsla(280,60%,40%,0.3)' }}>
        <Camera size={28} className="text-amethyst-glow" />
      </div>
      <div className="text-white/70 text-sm font-semibold mb-1">Camera Unavailable</div>
      <div className="text-white/30 text-xs mb-4 max-w-[240px]">{error}</div>
      <p className="text-white/50 text-xs mb-6 max-w-[240px]">
        You can still identify minerals by uploading a photo from your gallery.
      </p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => onUploadFallback?.(e.target.files?.[0])} />
      <Button onClick={() => fileRef.current?.click()}
        className="rounded-xl text-white font-semibold w-full max-w-[220px] h-12 text-sm"
        style={{ background: 'linear-gradient(135deg, hsla(270,80%,38%,0.9), hsla(280,100%,52%,0.7))', border: '1px solid hsla(280,80%,55%,0.4)' }}>
        <Upload size={14} className="mr-2" />
        Upload a Photo to Identify
      </Button>
    </div>
  );
}