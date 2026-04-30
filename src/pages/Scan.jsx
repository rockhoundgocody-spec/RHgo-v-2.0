import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Upload, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel';
import HudFrame from '@/components/visuals/HudFrame';
import { Button } from '@/components/ui/button';

export default function Scan() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setResult(null);
    setSavedId(null);
    setAnalyzing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt:
        'Identify the mineral or rock in this image. Provide your top 3 candidate identifications with confidence scores (0-1). Include common name, scientific/mineral name, key visual features observed, and a one-sentence description.',
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          top_match: { type: 'string' },
          confidence: { type: 'number' },
          description: { type: 'string' },
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                confidence: { type: 'number' },
                features: { type: 'string' },
              },
            },
          },
        },
      },
    });
    setResult(r);
    setAnalyzing(false);
  };

  const saveToCollection = async () => {
    if (!result || !imageUrl) return;
    const created = await base44.entities.Specimen.create({
      mineral_name: result.top_match,
      common_name: result.top_match,
      image_url: imageUrl,
      ai_confidence: result.confidence,
      ai_candidates: result.candidates,
      notes: result.description,
      found_date: new Date().toISOString().split('T')[0],
    });
    setSavedId(created.id);
  };

  const reset = () => {
    setImage(null);
    setImageUrl(null);
    setResult(null);
    setSavedId(null);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Scan</h1>
        <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">
          AI Mineral ID
        </p>
      </div>

      <GlassPanel variant="hud" className="mb-4">
        <HudFrame label="Specimen Capture">
          <div className="aspect-square rounded-md overflow-hidden hud-grid-bg relative flex items-center justify-center">
            {image ? (
              <>
                <img src={image} alt="specimen" className="w-full h-full object-cover" />
                {analyzing && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-hud mb-3" size={32} />
                    <div className="text-hud text-xs tracking-[0.3em] uppercase glow-hud">
                      Analyzing…
                    </div>
                    <div
                      className="absolute inset-x-0 h-16 bg-gradient-to-b from-hud-cyan/40 to-transparent animate-hud-scan"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-white/40">
                <Camera size={48} className="mx-auto mb-2" />
                <p className="text-xs uppercase tracking-wider">Tap below to capture</p>
              </div>
            )}
          </div>
        </HudFrame>
      </GlassPanel>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {!result && (
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={analyzing}
          className="w-full bg-amethyst/30 hover:bg-amethyst/40 border border-amethyst/50 text-white h-14 rounded-xl shadow-[0_0_30px_-10px_hsla(280,100%,60%,0.6)]"
        >
          <Upload className="mr-2" size={18} />
          {image ? 'Try Another Image' : 'Capture or Upload'}
        </Button>
      )}

      {result && (
        <GlassPanel className="mt-4">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-amethyst-glow" size={16} />
              <span className="text-amethyst-glow text-xs uppercase tracking-[0.3em]">
                Identification
              </span>
            </div>
            <div className="text-2xl font-bold text-white glow-amethyst mb-1">
              {result.top_match}
            </div>
            <div className="text-amethyst/70 text-xs font-mono mb-3">
              {(result.confidence * 100).toFixed(0)}% confidence
            </div>
            <p className="text-white/70 text-sm mb-4">{result.description}</p>

            {result.candidates?.length > 1 && (
              <div className="space-y-1.5 mb-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">
                  Other candidates
                </div>
                {result.candidates.slice(1).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-white/5 border border-white/5"
                  >
                    <span className="text-white/80">{c.name}</span>
                    <span className="font-mono text-amethyst/70">
                      {(c.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={saveToCollection}
                disabled={!!savedId}
                className="flex-1 bg-amethyst-deep hover:bg-amethyst text-white border border-amethyst/40"
              >
                {savedId ? 'Saved ✓' : 'Save to Collection'}
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                className="border-white/20 text-white/80 hover:bg-white/5"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}