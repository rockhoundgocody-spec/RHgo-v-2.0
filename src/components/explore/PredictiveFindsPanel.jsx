import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';

/**
 * AI-powered "what minerals are likely here?" prediction.
 * Sends user coords + nearby hotspot context to the LLM to surface
 * realistic finds for the current geology — a key wedge competitors lack.
 */
export default function PredictiveFindsPanel({ userLocation, hotspots = [] }) {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState(null);

  const predict = async () => {
    if (!userLocation) {
      setError('Tap "My Location" first to enable predictions.');
      return;
    }
    setLoading(true);
    setError(null);
    setPredictions(null);

    const nearby = hotspots
      .map((h) => ({ ...h, _d: distMiles(userLocation, h) }))
      .filter((h) => h._d < 100)
      .sort((a, b) => a._d - b._d)
      .slice(0, 6)
      .map((h) => `- ${h.name} (${h._d.toFixed(1)} mi, ${h.state}): ${(h.minerals || []).join(', ') || 'unknown minerals'}`)
      .join('\n');

    const prompt = `You are a field geologist advising a rockhound at coordinates ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}.

Nearby known hotspots:
${nearby || '(none catalogued nearby)'}

Based on regional geology, predict 4-6 minerals the rockhound is REALISTICALLY likely to find within ~50 miles. For each, include why it occurs there in one short sentence.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          predictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mineral: { type: 'string' },
                likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
                reason: { type: 'string' },
              },
              required: ['mineral', 'likelihood', 'reason'],
            },
          },
          region_summary: { type: 'string' },
        },
        required: ['predictions'],
      },
    });
    setPredictions(res);
    setLoading(false);
  };

  const likelihoodColor = {
    high: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
    medium: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
    low: 'text-white/50 border-white/15 bg-white/5',
  };

  return (
    <GlassPanel variant="hud" className="mt-4">
      <HudFrame label="Predictive AI — Likely Finds">
        <div className="py-2">
          <button
            type="button"
            onClick={predict}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-lg border border-amethyst/40 bg-amethyst/10 hover:bg-amethyst/20 disabled:opacity-50 text-amethyst-glow text-xs uppercase tracking-[0.3em] transition"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Reading the rocks…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Predict Likely Finds
              </>
            )}
          </button>

          {error && <div className="mt-3 text-rose-300 text-xs">{error}</div>}

          {predictions?.region_summary && (
            <p className="mt-3 text-white/70 text-xs leading-relaxed">
              {predictions.region_summary}
            </p>
          )}

          {predictions?.predictions?.length > 0 && (
            <ul className="mt-3 space-y-2">
              {predictions.predictions.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-black/30 border border-white/10"
                >
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${
                      likelihoodColor[p.likelihood] || likelihoodColor.low
                    }`}
                  >
                    {p.likelihood}
                  </span>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-semibold">{p.mineral}</div>
                    <div className="text-white/60 text-xs leading-snug">{p.reason}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </HudFrame>
    </GlassPanel>
  );
}

// Approximate miles between two lat/lng points (haversine)
function distMiles(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}