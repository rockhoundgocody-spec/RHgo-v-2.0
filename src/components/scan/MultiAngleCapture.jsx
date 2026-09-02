import React, { useState } from 'react';
import useCameraStream from './useCameraStream';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { Button } from '@/components/ui/button';
import TorchButton from './TorchButton.jsx';
import { Camera, Plus, Sparkles } from 'lucide-react';

/**
 * MultiAngleCapture — free-form capture: take one shot or several, then analyze.
 * Calls onComplete(shots[]) with { key, label, captured, blob } entries.
 */
export default function MultiAngleCapture({ onComplete, onCancel }) {
  const { videoRef, ready, capture, torchSupported, torchOn, toggleTorch } = useCameraStream({ active: true });
  const [shots, setShots] = useState([]);
  const [flash, setFlash] = useState(false);

  const handleSnap = async () => {
    const blob = await capture();
    if (!blob) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    setShots((s) => [...s, blob]);
  };

  const handleAnalyze = () => {
    if (!shots.length) return;
    onComplete?.(shots.map((blob, i) => ({ key: `shot${i + 1}`, label: `Shot ${i + 1}`, captured: true, blob })));
  };

  return (
    <HudFrame label={shots.length ? `Capture · ${shots.length} shot${shots.length > 1 ? 's' : ''}` : 'Capture'} className="-mx-3" contentClassName="px-1 pt-1">
      {/* Tall 2:3 viewport with object-contain — the full frame is shown and captured */}
      <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden hud-grid-bg">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-contain py-1" />
        
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
            'radial-gradient(circle at center, transparent 35%, hsla(240,40%,3%,0.6) 100%)'
          }} />
        

        {/* Flashlight */}
        <div className="absolute bottom-2 right-2 z-20">
          <TorchButton supported={torchSupported} on={torchOn} onToggle={toggleTorch} />
        </div>

        {/* flash on capture */}
        {flash &&
        <div className="absolute inset-0 bg-white/70 pointer-events-none animate-pulse" />
        }

        <div className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] text-hud-cyan/80 glow-hud">
          ◉ CAPTURE
        </div>
        {shots.length > 0 &&
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono"
        style={{ background: 'hsla(145,80%,30%,0.35)', border: '1px solid hsl(145 90% 55%)', color: 'hsl(145 90% 70%)' }}>
            {shots.length} taken
          </div>
        }
        <div className="absolute bottom-3 left-3 right-3 text-center">
          <div className="text-amethyst-glow text-xs font-mono uppercase tracking-[0.3em] glow-amethyst">
            {shots.length ? 'Add another angle or analyze' : 'Frame the specimen'}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          onClick={handleSnap}
          disabled={!ready}
          className="flex-1 bg-amethyst/30 hover:bg-amethyst/40 border border-amethyst/50 text-white h-12 rounded-xl shadow-[0_0_24px_-10px_hsla(280,100%,60%,0.6)]">
          
          {shots.length ? <Plus className="mr-2" size={16} /> : <Camera className="mr-2" size={16} />}
          {shots.length ? 'Add another' : 'Snap photo'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-white/20 text-white/80 hover:bg-white/5 h-12">
          
          Cancel
        </Button>
      </div>

      {shots.length > 0 &&
      <Button
        onClick={handleAnalyze}
        className="mt-2 w-full h-12 rounded-xl text-white font-bold"
        style={{
          background: 'linear-gradient(135deg, hsla(265,70%,50%,0.95), hsla(280,80%,60%,0.95))',
          border: '1px solid hsla(280,80%,70%,0.5)',
          boxShadow: '0 0 24px hsla(265,80%,55%,0.4)'
        }}>
        
          <Sparkles className="mr-2" size={16} />
          Analyze {shots.length} shot{shots.length > 1 ? 's' : ''}
        </Button>
      }
    </HudFrame>);

}