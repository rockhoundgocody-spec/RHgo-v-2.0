import React, { useEffect, useRef, useState } from 'react';
import useCameraStream from './useCameraStream';
import HolographicReticle from './HolographicReticle.jsx';
import SignalMeter from './SignalMeter.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * LiveScanStage — Phase 1 of the scan flow. Live camera feed with
 * holographic targeting reticle and ambient AI "signal" simulation.
 * Pressing "Begin Detailed Scan" advances to multi-photo capture.
 */
export default function LiveScanStage({ onBeginCapture, onUploadFallback }) {
  const { videoRef, ready, error } = useCameraStream({ active: true });
  const [signal, setSignal] = useState(0);
  const fileRef = useRef(null);

  // Simulate building AI lock-on signal once camera is ready.
  // (Real ML detection can replace this loop later.)
  useEffect(() => {
    if (!ready) return;
    let raf;
    let t = 0;
    const tick = () => {
      t += 0.016;
      const target = 0.55 + Math.sin(t * 0.6) * 0.25 + Math.sin(t * 1.7) * 0.1;
      setSignal((s) => s + (target - s) * 0.04);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  const locked = signal > 0.7;

  return (
    <HudFrame label="Live Vision Feed">
      <div className="relative aspect-square w-full rounded-md overflow-hidden hud-grid-bg">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <AlertCircle className="text-amethyst-glow mb-2" size={28} />
            <div className="text-white/80 text-sm mb-1">Camera unavailable</div>
            <div className="text-white/50 text-xs mb-4">{error}</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUploadFallback?.(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              className="border-amethyst/40 text-white"
            >
              Upload an image instead
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* darken / vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, transparent 40%, hsla(240,40%,3%,0.55) 100%)',
              }}
            />
            <HolographicReticle signal={signal} locked={locked} label="SCANNING" />

            {/* side gauges */}
            <div className="absolute top-3 right-3">
              <SignalMeter value={signal} label="SIG" />
            </div>
            <div className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] text-hud-cyan/80 glow-hud">
              ◉ LIVE
            </div>
            <div className="absolute bottom-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] text-white/50">
              {ready ? 'CAM·READY' : 'CAM·INIT…'}
            </div>
          </>
        )}
      </div>

      {/* CTA strip */}
      {!error && (
        <div className="mt-3 flex gap-2">
          <Button
            onClick={onBeginCapture}
            disabled={!ready}
            className="flex-1 bg-amethyst/30 hover:bg-amethyst/40 border border-amethyst/50 text-white h-12 rounded-xl shadow-[0_0_24px_-10px_hsla(280,100%,60%,0.6)]"
          >
            <Camera className="mr-2" size={16} />
            Begin Detailed Scan
          </Button>
        </div>
      )}
    </HudFrame>
  );
}