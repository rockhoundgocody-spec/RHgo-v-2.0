import React, { useState, useRef } from 'react';
import { MapPin, Loader2, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function PsvPhotoStage({ onReady }) {
  const [previews, setPreviews] = useState([]);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (files) => {
    const next = Array.from(files).slice(0, 4 - previews.length);
    next.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((p) => [...p, { file, preview: e.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false); },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const handleStart = async () => {
    if (!previews.length) return;
    setUploading(true);
    const urls = await Promise.all(
      previews.map(async ({ file }) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      })
    );
    setUploading(false);
    onReady({ imageUrls: urls, lat, lng });
  };

  return (
    <GlassPanel className="p-5 space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst/60 mb-3">Photos (1–4)</div>
        <div className="grid grid-cols-4 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-black/30 border border-white/10">
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setPreviews((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove photo ${i + 1}`}
                title="Remove photo"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-colors"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
          {previews.length < 4 && (
            <button onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-amethyst/30 flex flex-col items-center justify-center gap-1 text-amethyst/50 hover:text-amethyst-glow hover:border-amethyst/60 transition">
              <Plus size={18} />
              <span className="text-[9px] uppercase tracking-[0.2em]">Add</span>
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={locate} disabled={locating}
          className="flex items-center gap-2 text-xs text-hud-cyan border border-hud-cyan/30 rounded-lg px-3 py-2 hover:bg-hud-cyan/10 transition">
          {locating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
          {lat ? `${lat.toFixed(3)}, ${lng.toFixed(3)}` : 'Add location'}
        </button>
        {lat && <button onClick={() => { setLat(null); setLng(null); }} className="text-white/30 text-xs hover:text-white/60">Clear</button>}
      </div>

      <Button onClick={handleStart} disabled={!previews.length || uploading}
        className="w-full py-5 text-base bg-amethyst-deep hover:bg-amethyst border border-amethyst/40 text-white font-semibold">
        {uploading ? <><Loader2 className="animate-spin mr-2" size={16} />Uploading…</> : <>Start Progressive Verification →</>}
      </Button>

      <p className="text-white/30 text-xs text-center">More angles = higher confidence. Add close-up and scale shots.</p>
    </GlassPanel>
  );
}