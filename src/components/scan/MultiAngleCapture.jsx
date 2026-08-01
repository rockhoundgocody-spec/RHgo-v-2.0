import React, { useState } from 'react';
import useCameraStream from './useCameraStream';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import AngleGuide from './AngleGuide.jsx';
import { Button } from '@/components/ui/button';
import TorchButton from './TorchButton.jsx';
import { Camera, Check } from 'lucide-react';

const ANGLES = [
  { key: 'front', label: 'Front view' },
  { key: 'side', label: 'Side · 90°' },
  { key: 'back', label: 'Back · 180°' },
  { key: 'top', label: 'Top down' },
];

/**
 * MultiAngleCapture — guides user through capturing N angles of a specimen
 * for 3D reconstruction. Calls onComplete(blobs[]) when all angles captured.
 */
export default function MultiAngleCapture({ onComplete, onCancel }) {
  const { videoRef, ready, capture, torchSupported, torchOn, toggleTorch } = useCameraStream({ active: true });
  const [angles, setAngles] = useState(ANGLES.map((a) => ({ ...a, captured: false, blob: null })));
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState(false);

  const handleSnap = async () => {
    const blob = await capture();
    if (!blob) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    const next = [...angles];
    next[index] = { ...next[index], captured: true, blob };
    setAngles(next);

    const nextIdx = next.findIndex((a) => !a.captured);
    if (nextIdx === -1) {
      onComplete?.(next);
    } else {
      setIndex(nextIdx);
    }
  };

  const completed = angles.filter((a) => a.captured).length;

  return (
    <HudFrame label={`Multi-Angle Capture · ${completed}/${angles.length}`}>
      {/* 4:3 viewport with object-contain — holding the phone sideways shows
          (and captures) the whole landscape frame instead of cropping it */}
      <div className="relative aspect-[4/3] w-full rounded-md overflow-hidden hud-grid-bg">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-contain"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, transparent 35%, hsla(240,40%,3%,0.6) 100%)',
          }}
        />

        {/* Flashlight */}
        <div className="absolute bottom-2 right-2 z-20">
          <TorchButton supported={torchSupported} on={torchOn} onToggle={toggleTorch} />
        </div>

        {/* flash on capture */}
        {flash && (
          <div className="absolute inset-0 bg-white/70 pointer-events-none animate-pulse" />
        )}

        {/* angle progress dial */}
        <div className="absolute top-2 right-2">
          <AngleGuide angles={angles} currentIndex={index} />
        </div>

        <div className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] text-hud-cyan/80 glow-hud">
          ◉ CAPTURE
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-center">
          <div className="text-amethyst-glow text-xs font-mono uppercase tracking-[0.3em] glow-amethyst">
            Frame the specimen · {angles[index]?.label}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          onClick={handleSnap}
          disabled={!ready}
          className="flex-1 bg-amethyst/30 hover:bg-amethyst/40 border border-amethyst/50 text-white h-12 rounded-xl shadow-[0_0_24px_-10px_hsla(280,100%,60%,0.6)]"
        >
          <Camera className="mr-2" size={16} />
          Snap {angles[index]?.label}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-white/20 text-white/80 hover:bg-white/5 h-12"
        >
          Cancel
        </Button>
      </div>

      {/* progress chips */}
      <div className="mt-3 flex gap-1.5 justify-center">
        {angles.map((a, i) => (
          <div
            key={a.key}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider"
            style={{
              background: a.captured
                ? 'hsla(145,80%,30%,0.3)'
                : i === index
                  ? 'hsla(280,80%,40%,0.3)'
                  : 'hsla(220,30%,20%,0.3)',
              border: `1px solid ${a.captured ? 'hsl(145 90% 55%)' : i === index ? 'hsl(280 100% 70%)' : 'hsla(220,30%,40%,0.4)'}`,
              color: a.captured ? 'hsl(145 90% 70%)' : i === index ? 'hsl(280 100% 85%)' : 'hsla(0,0%,80%,0.5)',
            }}
          >
            {a.captured && <Check size={9} />}
            {a.label}
          </div>
        ))}
      </div>
    </HudFrame>
  );
}