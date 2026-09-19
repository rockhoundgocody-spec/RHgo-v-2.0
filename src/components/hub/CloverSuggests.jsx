import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Loader2, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatDistance, readLastGps } from '@/lib/geo';

/**
 * CloverSuggests — personalized "hunt next" from collection gaps + nearby sites.
 */
export default function CloverSuggests({ gps }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cached = gps || readLastGps();
        const res = await base44.functions.invoke('suggestNextFinds', {
          lat: cached?.lat,
          lng: cached?.lng,
        });
        if (alive) setData(res?.data || res);
      } catch {
        /* non-critical */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [gps?.lat, gps?.lng]);

  if (loading) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3 page-card">
        <Loader2 size={16} className="animate-spin text-emerald-400/60" />
        <span className="text-white/40 text-xs font-medium">Clover is scouting nearby…</span>
      </div>
    );
  }

  if (!data?.suggestions?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsla(150,50%,12%,0.5) 0%, hsla(240,30%,8%,0.7) 100%)',
        border: '1px solid hsla(150,60%,40%,0.25)',
        boxShadow: '0 0 24px -8px hsla(150,60%,40%,0.2)',
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'hsla(150,60%,30%,0.3)', border: '1px solid hsla(150,70%,50%,0.3)' }}>
          <Sparkles size={13} className="text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Clover Suggests</div>
          <div className="text-white/50 text-[11px] leading-snug mt-0.5 line-clamp-2">{data.clover_intro}</div>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-1.5">
        {data.suggestions.slice(0, 3).map((s, i) => {
          const spot = s.hotspot_id || s.hotspot_name;
          return (
            <Link
              key={`${s.mineral_name}-${i}`}
              to={spot ? `/explore?spot=${encodeURIComponent(spot)}` : '/explore'}
              className="flex items-center gap-3 px-2.5 py-2 rounded-xl transition hover:bg-white/5 active:scale-[0.98]"
              style={{ background: 'hsla(150,40%,10%,0.4)', border: '1px solid hsla(150,50%,40%,0.12)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsla(150,60%,25%,0.3)' }}>
                <Compass size={14} className="text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-bold truncate">{s.mineral_name}</div>
                <div className="text-white/40 text-[10px] truncate flex items-center gap-1">
                  {s.hotspot_name && (
                    <>
                      <MapPin size={9} /> {s.hotspot_name}
                      {s.distance_mi != null ? ` · ${formatDistance(s.distance_mi)}` : ''}
                    </>
                  )}
                </div>
                {s.what_to_look_for && (
                  <div className="text-white/35 text-[10px] truncate mt-0.5">{s.what_to_look_for}</div>
                )}
              </div>
              {s.difficulty && (
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    color: { easy: '#34d399', moderate: '#fbbf24', hard: '#f97316', expert: '#fb7185' }[s.difficulty] || '#94a3b8',
                    background: 'hsla(255,30%,12%,0.5)',
                  }}>
                  {s.difficulty}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
