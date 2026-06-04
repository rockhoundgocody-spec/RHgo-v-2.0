import React, { useEffect, useRef, useState } from 'react';
import useCameraStream from './useCameraStream';
import { Camera, Upload, Crosshair, Gem, ScanLine, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * LiveScanStage — Redesigned mineral scanner viewport.
 * Amethyst-purple theme, clean reticle, animated scan sweep.
 */
export default function LiveScanStage({ onBeginCapture, onUploadFallback }) {
  const { videoRef, ready, error } = useCameraStream({ active: true });
  const [signal, setSignal] = useState(0);
  const [scanPulse, setScanPulse] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!ready) return;
    let raf;
    let t = 0;
    const tick = () => {
      t += 0.016;
      const target = 0.5 + Math.sin(t * 0.55) * 0.28 + Math.sin(t * 1.4) * 0.12;
      setSignal((s) => s + (target - s) * 0.04);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // Pulse the scan ring every 2.5s
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      setScanPulse(true);
      setTimeout(() => setScanPulse(false), 800);
    }, 2500);
    return () => clearInterval(interval);
  }, [ready]);

  const locked = signal > 0.68;

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'hsla(265,40%,4%,0.95)',
        border: '1px solid hsla(280,60%,50%,0.3)',
        boxShadow: '0 0 50px hsla(280,80%,40%,0.2), inset 0 0 60px hsla(265,60%,3%,0.5)',
      }}>

      {/* TOP STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid hsla(280,40%,30%,0.25)', background: 'hsla(265,50%,5%,0.8)' }}>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">
            {ready ? (locked ? 'Mineral Detected' : 'Scanning…') : 'Initializing…'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Gem size={11} className="text-amethyst-glow" />
          <span className="text-[10px] font-mono text-amethyst-glow/60 uppercase tracking-[0.2em]">
            RockHound·ID
          </span>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {error ? (
          <ErrorView error={error} fileRef={fileRef} onUploadFallback={onUploadFallback} />
        ) : (
          <>
            {/* Camera feed */}
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

            {/* Dark vignette */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, transparent 40%, hsla(265,60%,3%,0.7) 100%)' }} />

            {/* Amethyst color wash on edges */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, hsla(280,80%,40%,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, hsla(265,70%,20%,0.2) 0%, transparent 50%)' }} />

            {/* Subtle scan grid */}
            <div className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage: 'linear-gradient(hsla(280,80%,60%,0.4) 1px, transparent 1px), linear-gradient(90deg, hsla(280,80%,60%,0.4) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }} />

            {/* RETICLE — centered scanning frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <ReticleRing signal={signal} locked={locked} pulsing={scanPulse} />
            </div>

            {/* Corner brackets */}
            <CornerBrackets color={locked ? '#34d399' : 'hsla(280,100%,75%,0.8)'} />

            {/* Animated scan sweep */}
            <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-x-0 h-24 animate-hud-scan"
                style={{ background: 'linear-gradient(180deg, transparent, hsla(280,100%,65%,0.12), transparent)' }} />
            </div>

            {/* Bottom data strip */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-3 pt-8 pointer-events-none"
              style={{ background: 'linear-gradient(0deg, hsla(265,60%,4%,0.9) 0%, transparent 100%)' }}>
              <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.25em] text-white/35">
                <span>{locked ? '⬟ Specimen in frame' : '⬞ Align specimen'}</span>
                <span>{(signal * 100).toFixed(0)}% lock</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* BOTTOM ACTIONS */}
      {!error && (
        <div className="p-4 space-y-2" style={{ borderTop: '1px solid hsla(280,40%,25%,0.3)', background: 'hsla(265,50%,4%,0.8)' }}>
          <Button
            onClick={onBeginCapture}
            disabled={!ready}
            className="w-full h-14 rounded-xl text-sm font-bold uppercase tracking-[0.2em] text-white disabled:opacity-40"
            style={{
              background: ready
                ? 'linear-gradient(135deg, hsla(270,80%,40%,0.9) 0%, hsla(280,100%,55%,0.7) 100%)'
                : 'hsla(270,40%,20%,0.4)',
              border: '1px solid hsla(280,80%,60%,0.4)',
              boxShadow: ready ? '0 0 30px hsla(280,80%,50%,0.3), inset 0 1px 0 hsla(280,100%,90%,0.1)' : 'none',
            }}
          >
            <ScanLine size={18} className="mr-2" />
            {ready ? 'Scan Mineral' : 'Starting Camera…'}
          </Button>

          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition"
              style={{ border: '1px solid hsla(280,30%,30%,0.3)' }}
            >
              <Upload size={13} />
              Upload Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => onUploadFallback?.(e.target.files?.[0])} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function ReticleRing({ signal, locked, pulsing }) {
  const size = 180;
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(signal, 1);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer pulse ring on scan */}
      {pulsing && (
        <div className="absolute rounded-full pointer-events-none"
          style={{
            width: size + 40, height: size + 40,
            border: `2px solid ${locked ? 'hsla(145,80%,55%,0.6)' : 'hsla(280,100%,70%,0.5)'}`,
            animation: 'ping 0.8s ease-out forwards',
            opacity: 0,
          }} />
      )}

      {/* Progress arc */}
      <svg width={size} height={size} className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsla(280,50%,30%,0.3)" strokeWidth={2} />
        {/* Progress */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={locked ? '#34d399' : 'hsl(280,100%,75%)'}
          strokeWidth={2.5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${locked ? '#34d399' : 'hsl(280,100%,65%)'})`, transition: 'stroke 0.4s' }}
        />
      </svg>

      {/* Corner tick marks */}
      {[0, 90, 180, 270].map((deg) => (
        <div key={deg} className="absolute" style={{
          width: 12, height: 12,
          border: `2px solid ${locked ? '#34d399' : 'hsla(280,100%,75%,0.8)'}`,
          borderRight: 'none', borderBottom: 'none',
          transform: `rotate(${deg}deg) translate(${-r + 4}px, ${-r + 4}px)`,
          transformOrigin: `${size / 2}px ${size / 2}px`,
          top: size / 2 - 6, left: size / 2 - 6,
          filter: locked ? 'drop-shadow(0 0 4px #34d399)' : 'drop-shadow(0 0 4px hsla(280,100%,70%,0.8))',
        }} />
      ))}

      {/* Center gem icon */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <Gem size={22} style={{ color: locked ? '#34d399' : 'hsl(280,100%,80%)', filter: `drop-shadow(0 0 8px ${locked ? '#34d399' : 'hsl(280,100%,65%)'})` }} />
        <span className="text-[8px] font-mono uppercase tracking-[0.35em]"
          style={{ color: locked ? '#34d399' : 'hsla(280,100%,80%,0.7)' }}>
          {locked ? 'LOCKED' : 'SCAN'}
        </span>
      </div>
    </div>
  );
}

function CornerBrackets({ color }) {
  const style = { border: `2px solid ${color}`, filter: `drop-shadow(0 0 5px ${color})` };
  const s = 20;
  return (
    <>
      <div className="absolute top-4 left-4 pointer-events-none" style={{ ...style, width: s, height: s, borderRight: 'none', borderBottom: 'none', borderRadius: '2px 0 0 0' }} />
      <div className="absolute top-4 right-4 pointer-events-none" style={{ ...style, width: s, height: s, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 2px 0 0' }} />
      <div className="absolute bottom-16 left-4 pointer-events-none" style={{ ...style, width: s, height: s, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 2px' }} />
      <div className="absolute bottom-16 right-4 pointer-events-none" style={{ ...style, width: s, height: s, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 2px 0' }} />
    </>
  );
}

function ErrorView({ error, fileRef, onUploadFallback }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
      style={{ background: 'hsla(265,50%,3%,0.95)' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'hsla(280,60%,20%,0.5)', border: '1px solid hsla(280,60%,40%,0.3)' }}>
        <Camera size={28} className="text-amethyst-glow" />
      </div>
      <div className="text-white/70 text-sm font-semibold mb-1">Camera Unavailable</div>
      <div className="text-white/35 text-xs mb-6 max-w-[240px]">{error}</div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => onUploadFallback?.(e.target.files?.[0])} />
      <Button onClick={() => fileRef.current?.click()}
        className="rounded-xl text-white font-semibold"
        style={{ background: 'linear-gradient(135deg, hsla(270,80%,40%,0.9), hsla(280,100%,55%,0.7))', border: '1px solid hsla(280,80%,60%,0.4)' }}>
        <Upload size={14} className="mr-2" />
        Upload a Photo Instead
      </Button>
    </div>
  );
}