import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { runPipeline, PIPELINE_TASKS } from '@/services/ai/pipelineTypes';
import PipelineStatusPanel from '@/components/scan/PipelineStatusPanel.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function SpecimenIdentifier() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userNotes, setUserNotes] = useState('');
  const [identifying, setIdentifying] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState(null);

  const handleImageSelect = async (file) => {
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = async () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.error('Location error:', err)
      );
    }
  };

  const handleIdentify = async () => {
    if (!imageFile) return;

    setIdentifying(true);
    setPipelineStatus('running');

    try {
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

      // Run specimen identification pipeline
      const scanResult = await runPipeline(PIPELINE_TASKS.SPECIMEN_IDENTIFICATION, {
        imageFile,
        userLocation,
        siteContext: null,
        userNotes,
        mode: 'quick'
      });

      setPipelineStatus(scanResult.status);

      // Navigate to result page
      navigate('/scan-result', {
        state: {
          scanResult,
          photoUrl: file_url,
          location: userLocation,
          userNotes
        }
      });
    } catch (error) {
      console.error('Identification error:', error);
      setPipelineStatus('failed');
    } finally {
      setIdentifying(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Identify Specimen</h1>
        <p className="text-white/50 text-sm mt-2">Capture or upload a mineral photo for AI analysis</p>
      </div>

      {identifying && pipelineStatus === 'running' && (
        <div className="mb-6">
          <PipelineStatusPanel status="running" taskName="specimen-identification" />
        </div>
      )}

      <div className="space-y-4">
        {/* Image preview */}
        {imageUrl && (
          <GlassPanel className="p-4">
            <img src={imageUrl} alt="Preview" className="w-full rounded-lg" />
          </GlassPanel>
        )}

        {!imageUrl && (
          <GlassPanel variant="hud" className="p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-hud-cyan/10 border border-hud-cyan/25">
              <Camera size={24} className="text-hud-cyan" />
            </div>
            <p className="text-white/60 mb-4">No image selected yet</p>
          </GlassPanel>
        )}

        {/* Upload buttons */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleImageSelect(e.target.files?.[0])}
        />

        <div className="flex gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-hud-cyan/10 border border-hud-cyan/25 text-hud-cyan hover:bg-hud-cyan/20 transition font-semibold"
          >
            <Camera size={16} /> Take Photo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition font-semibold"
          >
            <Upload size={16} /> Upload
          </button>
        </div>

        {/* User notes */}
        <GlassPanel className="p-4">
          <label className="block text-xs text-white/60 uppercase tracking-[0.2em] font-mono mb-2">
            Field Notes (Optional)
          </label>
          <textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Luster, color, hardness, location details…"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-amethyst/50 h-20 resize-none"
          />
        </GlassPanel>

        {/* Location */}
        <GlassPanel className="p-4">
          <button
            onClick={handleGetLocation}
            className="w-full py-2 text-xs text-white/60 hover:text-white transition"
          >
            {userLocation
              ? `📍 Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
              : '📍 Add Location (helps with ID)'}
          </button>
        </GlassPanel>

        {/* Identify button */}
        <button
          onClick={handleIdentify}
          disabled={!imageFile || identifying}
          className="w-full py-4 rounded-xl bg-amethyst-deep hover:bg-amethyst disabled:opacity-40 text-white font-bold text-base flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          {identifying ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Analyzing…
            </>
          ) : (
            'Identify Mineral'
          )}
        </button>
      </div>
    </div>
  );
}