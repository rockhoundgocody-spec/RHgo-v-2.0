/**
 * IntentionRoulette — Randonautica-style wildcard hotspot generator.
 * User types an intention → Clover picks a random spot nearby → map pin drops.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, MapPin, Loader2, Navigation, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

const getSecureRandomIndex = (max) => {
  if (max <= 0) return 0;
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
};

const SAMPLE_INTENTIONS = [
  'find something purple',
  'discover a crystal',
  'find the oldest rock',
  'locate something sparkly',
  'hunt for a geode',
];

export default function IntentionRoulette() {
  const [intention, setIntention] = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  const spin = async () => {
    setError(null);
    setResult(null);

    const intentionText = intention.trim() || SAMPLE_INTENTIONS[getSecureRandomIndex(SAMPLE_INTENTIONS.length)];

    setLoading(true);
    try {
      let lat = 39.5, lng = -98.35; // fallback: center of USA
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (_) { /* use fallback */ }

      const response = await base44.functions.invoke('intentionRoulette', {
        lat, lng,
        radiusMiles: 5,
        intention: intentionText,
      });

      setResult({ ...response.data, usedIntention: intentionText });
    } catch (e) {
      setError('The rocks are shy today. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const randomPlaceholder = SAMPLE_INTENTIONS[getSecureRandomIndex(SAMPLE_INTENTIONS.length)];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsla(280,60%,14%,0.9) 0%, hsla(260,50%,9%,0.95) 100%)',
        border: '1px solid hsla(280,70%,55%,0.25)',
        boxShadow: '0 0 32px hsla(280,80%,50%,0.1)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b" style={{ borderColor: 'hsla(280,50%,40%,0.2)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsla(280,80%,50%,0.18)', border: '1px solid hsla(280,70%,55%,0.3)' }}>
          <Shuffle size={18} style={{ color: 'hsl(280,85%,78%)' }} />
        </div>
        <div>
          <div className="text-white font-bold text-sm">Intention Roulette</div>
          <div className="text-white/40 text-[10px] uppercase tracking-wider">Randonautica-style wildcard</div>
        </div>
        <Sparkles size={14} className="ml-auto" style={{ color: 'hsla(280,80%,70%,0.6)' }} />
      </div>

      {/* Input */}
      <div className="px-4 py-3">
        <p className="text-white/50 text-[11px] mb-2 leading-relaxed">
          Set your intention — Clover picks a random hotspot nearby that matches your vibe.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={intention}
            onChange={e => setIntention(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && spin()}
            placeholder={randomPlaceholder}
            maxLength={60}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white/90 placeholder-white/25 outline-none"
            style={{ background: 'hsla(255,30%,18%,0.8)', border: '1px solid hsla(270,30%,40%,0.3)' }}
          />
          <button
            onClick={spin}
            disabled={loading}
            className="w-11 h-[42px] rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{
              background: loading ? 'hsla(280,50%,25%,0.6)' : 'linear-gradient(135deg, hsl(280,80%,55%), hsl(265,70%,45%))',
              border: '1px solid hsla(280,70%,60%,0.4)',
              boxShadow: loading ? 'none' : '0 0 20px hsla(280,80%,55%,0.35)',
            }}
          >
            {loading
              ? <Loader2 size={16} className="text-white/60 animate-spin" />
              : <Shuffle size={16} className="text-white" />
            }
          </button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-4"
          >
            {/* Clover message */}
            <div className="rounded-xl px-3 py-2.5 mb-3"
              style={{ background: 'hsla(155,60%,18%,0.5)', border: '1px solid hsla(155,60%,40%,0.25)' }}>
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">🍀</span>
                <p className="text-[12px] text-white/80 leading-relaxed italic">
                  "{result.cloversMessage}"
                </p>
              </div>
            </div>

            {/* Random coordinate */}
            <div className="rounded-xl px-3 py-2 mb-2 flex items-center gap-2"
              style={{ background: 'hsla(280,50%,15%,0.6)', border: '1px solid hsla(280,50%,40%,0.2)' }}>
              <MapPin size={13} style={{ color: 'hsl(280,85%,75%)', flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="text-white/60 text-[9px] uppercase tracking-wider mb-0.5">Random Wildcard Point</div>
                <div className="text-white/80 text-[11px] font-mono truncate">
                  {result.randomPoint.lat.toFixed(5)}, {result.randomPoint.lng.toFixed(5)}
                </div>
              </div>
            </div>

            {/* Nearest hotspot */}
            {result.nearestHotspot && (
              <div className="rounded-xl px-3 py-2 mb-3"
                style={{ background: 'hsla(195,60%,14%,0.6)', border: '1px solid hsla(195,70%,40%,0.25)' }}>
                <div className="text-white/50 text-[9px] uppercase tracking-wider mb-1">Nearest Hotspot</div>
                <div className="text-white font-semibold text-sm">{result.nearestHotspot.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  {result.nearestHotspot.difficulty && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ background: 'hsla(195,60%,20%,0.6)', color: 'hsl(195,100%,75%)' }}>
                      {result.nearestHotspot.difficulty}
                    </span>
                  )}
                  {result.nearestHotspot.minerals?.slice(0, 2).map(m => (
                    <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'hsla(265,40%,20%,0.6)', color: '#c084fc', border: '1px solid hsla(265,60%,50%,0.2)' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigate CTA */}
            <Link
              to={`/explore`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, hsla(195,100%,40%,0.25), hsla(215,80%,35%,0.3))',
                border: '1px solid hsla(195,100%,60%,0.35)',
                color: 'hsl(195,100%,80%)',
                boxShadow: '0 0 16px hsla(195,100%,60%,0.15)',
              }}
            >
              <Navigation size={14} />
              Go Find It!
            </Link>
          </motion.div>
        )}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-4 pb-4 text-[11px] text-red-400/70 text-center">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}