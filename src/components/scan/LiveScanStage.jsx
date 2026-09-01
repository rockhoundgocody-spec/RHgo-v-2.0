import React, { useState } from 'react';
import useCameraStream from './useCameraStream';
import TorchButton from './TorchButton.jsx';
import { Upload, ScanLine, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * LiveScanStage — simplified scanner viewport.
 *
 * One clean camera view, one Scan button. Tapping Scan captures a single
 * frame and hands it to the parent for AI identification. No fake signal
 * bars, no multi-step HUD, no scan-mode picker — just point and snap.
 */
export default function LiveScanStage({ onCapture, onUploadFallback }) {
  const { videoRef, ready, error, capture, torchSupported, torchOn, toggleTorch } = useCameraStream({ active: true });
  const [snapping, setSnapping] = useState(false);

  const handleScan = async () => {
    if (!ready || snapping) return;
    setSnapping(true);
    try {
      const blob = await capture();
      if (blob) onCapture?.(blob);
    } finally {
      setSnapping(false);
    }
  };

  if (error) {
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
        <label htmlFor="error-upload-input"
          className="cursor-pointer rounded-xl text-white font-semibold w-full max-w-[220px] h-12 text-sm flex items-center justify-center focus-within:outline-none focus-within:ring-2 focus-within:ring-hud-cyan"
          style={{ background: 'linear-gradient(135deg, hsla(270,80%,38%,0.9), hsla(280,100%,52%,0.7))', border: '1px solid hsla(280,80%,55%,0.4)' }}>
          <Upload size={14} className="mr-2" />
          Upload a Photo to Identify
          <input id="error-upload-input" type="file" accept="image/*" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadFallback?.(f); }} />
        </label>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        background: 'hsla(265,40%,3%,0.98)',
        border: '1px solid hsla(280,60%,45%,0.35)',
        boxShadow: '0 0 40px -12px hsla(280,80%,50%,0.25)',
      }}>

      {/* ── CAMERA VIEWPORT ── */}
      <div className="relative overflow-hidden flex-1 min-h-0">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-contain" />

        {/* Soft vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, transparent 45%, hsla(265,60%,3%,0.7) 100%)' }} />

        {/* Center reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-2xl border-2 border-white/25"
            style={{ boxShadow: '0 0 24px hsla(280,80%,50%,0.2), inset 0 0 24px hsla(280,80%,50%,0.1)' }} />
        </div>

        {/* Status pill */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full z-10"
          style={{ background: 'hsla(220,40%,5%,0.85)', border: '1px solid hsla(280,60%,45%,0.35)', backdropFilter: 'blur(8px)' }}>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
            {ready ? '◉ Ready' : '◌ Initializing…'}
          </span>
        </div>

        {/* Flashlight */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
          <TorchButton supported={torchSupported} on={torchOn} onToggle={toggleTorch} />
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div className="p-4 space-y-2.5"
        style={{ borderTop: '1px solid hsla(280,60%,45%,0.35)', background: 'hsla(265,50%,3%,0.85)' }}>
        <Button onClick={handleScan} disabled={!ready || snapping}
          className="w-full h-14 rounded-xl text-sm font-bold uppercase tracking-[0.18em] text-white disabled:opacity-35"
          style={{
            background: ready
              ? 'linear-gradient(135deg, hsla(270,80%,38%,0.95) 0%, hsla(280,100%,52%,0.8) 100%)'
              : 'hsla(270,40%,18%,0.4)',
            border: '1px solid hsla(280,80%,55%,0.4)',
            boxShadow: ready ? '0 0 28px hsla(280,80%,50%,0.25), inset 0 1px 0 hsla(280,100%,90%,0.08)' : 'none',
          }}>
          <ScanLine size={18} className="mr-2.5" />
          {snapping ? 'Capturing…' : ready ? 'Scan Mineral' : 'Initializing…'}
        </Button>

        <label htmlFor="gallery-upload-input"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35 hover:text-white/60 transition-colors cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-hud-cyan"
          style={{ border: '1px solid hsla(280,30%,25%,0.3)' }}>
          <Upload size={13} />
          Upload from Gallery
          <input id="gallery-upload-input" type="file" accept="image/*" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadFallback?.(f); }} />
        </label>
      </div>
    </div>
  );
}