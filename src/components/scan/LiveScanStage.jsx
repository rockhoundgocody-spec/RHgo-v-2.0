import React, { useEffect, useRef, useState } from 'react';
import useCameraStream from './useCameraStream';
import HolographicReticle from './HolographicReticle.jsx';
import SignalMeter from './SignalMeter.jsx';
import HudCornerBrackets from './hud/HudCornerBrackets.jsx';
import HudTelemetryStrip from './hud/HudTelemetryStrip.jsx';
import HudGridOverlay from './hud/HudGridOverlay.jsx';
import HudSidebar from './hud/HudSidebar.jsx';
import HudActionBar from './hud/HudActionBar.jsx';
import WebGLTrackingLayer from './hud/WebGLTrackingLayer.jsx';
import LiveLabelsOverlay from './LiveLabelsOverlay.jsx';
import { Camera, AlertCircle, Upload, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * LiveScanStage — Full-bleed sci-fi HUD scanner viewport.
 * Layers (bottom→top):
 *   • Camera <video>
 *   • Vignette + grid overlay
 *   • WebGL tracking layer (placeholder canvas)
 *   • Holographic reticle (SVG)
 *   • HUD chrome (corners, sidebars, telemetry strips, action bar)
 */
export default function LiveScanStage({ onBeginCapture, onUploadFallback }) {
  const { videoRef, ready, error } = useCameraStream({ active: true });
  const [signal, setSignal] = useState(0);
  const fileRef = useRef(null);

  // Simulated lock-on signal — to be replaced by real ML output.
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
  const status = !ready ? 'BOOTING' : locked ? 'TARGET·LOCKED' : 'TRACKING';

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        background: 'hsla(220,70%,4%,0.85)',
        border: '1px solid hsla(195,100%,60%,0.35)',
        boxShadow:
          '0 0 0 1px hsla(195,100%,60%,0.1), 0 0 40px hsla(195,100%,50%,0.18), inset 0 0 60px hsla(220,80%,4%,0.6)',
      }}
    >
      {/* TOP TELEMETRY */}
      <HudTelemetryStrip status={status} signal={signal} />

      {/* MAIN VIEWPORT */}
      <div className="relative aspect-square w-full overflow-hidden">
        {error ? (
          <ErrorView error={error} fileRef={fileRef} onUploadFallback={onUploadFallback} />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* dim wash + cyan tint */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, transparent 38%, hsla(220,80%,4%,0.65) 100%), linear-gradient(180deg, hsla(195,100%,40%,0.08) 0%, transparent 30%, transparent 70%, hsla(220,80%,3%,0.4) 100%)',
              }}
            />

            {/* HUD grid */}
            <HudGridOverlay />

            {/* WebGL real-time tracking placeholder */}
            <WebGLTrackingLayer active={ready} />

            {/* Reticle */}
            <HolographicReticle signal={signal} locked={locked} label="SCANNING" />

            {/* Floating mineral labels — periodic AI classify */}
            <LiveLabelsOverlay videoRef={videoRef} active={ready} />

            {/* sidebars */}
            <HudSidebar side="left" label="ALT·M" />
            <HudSidebar side="right" label="DEPTH·CM" />

            {/* corner brackets */}
            <HudCornerBrackets />

            {/* readouts */}
            <div className="absolute top-3 left-9 right-9 flex justify-between text-[9px] font-mono uppercase tracking-[0.3em]">
              <div className="flex items-center gap-1.5 text-hud-cyan/80 glow-hud">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE·FEED
              </div>
              <div className="text-hud-cyan/60">{ready ? 'CAM·READY' : 'CAM·INIT…'}</div>
            </div>

            <div className="absolute bottom-3 left-9 right-9 flex justify-between items-end text-[9px] font-mono uppercase tracking-[0.3em]">
              <div className="text-hud-cyan/60">
                <div>LAT·N 41°47'·</div>
                <div>LNG·W 87°35'·</div>
              </div>
              <div className="text-right text-hud-cyan/60">
                <div>SPEC·HSL·1280×720</div>
                <div className="text-hud-cyan">SCAN·CH·07</div>
              </div>
            </div>

            {/* signal meter — floats over the right sidebar */}
            <div className="absolute top-1/2 right-7 -translate-y-1/2">
              <SignalMeter value={signal} label="LOCK" />
            </div>

            {/* scan-line sweep */}
            <div
              aria-hidden
              className="absolute inset-x-9 h-16 animate-hud-scan pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, transparent, hsla(195,100%,60%,0.18), transparent)',
              }}
            />
          </>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      {!error && (
        <HudActionBar>
          <div className="flex gap-2">
            <Button
              onClick={onBeginCapture}
              disabled={!ready}
              className="flex-1 h-12 rounded-md bg-transparent hover:bg-hud-cyan/10 text-hud-cyan font-mono uppercase tracking-[0.3em] text-xs"
              style={{
                border: '1px solid hsla(195,100%,60%,0.6)',
                boxShadow:
                  '0 0 18px hsla(195,100%,55%,0.35), inset 0 0 18px hsla(195,100%,55%,0.12)',
                textShadow: '0 0 8px hsla(195,100%,70%,0.7)',
              }}
            >
              <Crosshair className="mr-2" size={16} />
              Engage · Detailed Scan
            </Button>
            <Button
              onClick={() => fileRef.current?.click()}
              variant="ghost"
              className="h-12 px-3 text-hud-cyan/70 hover:bg-hud-cyan/5 border border-hud-cyan/20 rounded-md"
              title="Upload image"
            >
              <Upload size={16} />
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUploadFallback?.(e.target.files?.[0])}
            />
          </div>
        </HudActionBar>
      )}
    </div>
  );
}

function ErrorView({ error, fileRef, onUploadFallback }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 hud-grid-bg">
      <AlertCircle className="text-hud-cyan mb-3 glow-hud" size={32} />
      <div className="text-hud-cyan/90 text-xs font-mono uppercase tracking-[0.3em] mb-2">
        Camera·Offline
      </div>
      <div className="text-white/50 text-xs mb-5 max-w-[260px]">{error}</div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onUploadFallback?.(e.target.files?.[0])}
      />
      <Button
        onClick={() => fileRef.current?.click()}
        className="bg-transparent text-hud-cyan font-mono uppercase tracking-[0.3em] text-xs"
        style={{
          border: '1px solid hsla(195,100%,60%,0.6)',
          boxShadow: '0 0 16px hsla(195,100%,55%,0.3)',
        }}
      >
        <Camera size={14} className="mr-2" />
        Upload·Image
      </Button>
    </div>
  );
}