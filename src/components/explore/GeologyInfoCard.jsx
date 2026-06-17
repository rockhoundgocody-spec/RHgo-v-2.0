/**
 * GeologyInfoCard — shows Macrostrat bedrock units beneath a lat/lng.
 */
import React, { useEffect, useState } from 'react';
import { Mountain, Loader2, X } from 'lucide-react';
import { fetchGeologyAt } from '@/lib/macrostrat';

export default function GeologyInfoCard({ lat, lng, onClose }) {
  const [units, setUnits] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setUnits(null);
    fetchGeologyAt(lat, lng)
      .then((u) => { if (!cancelled) setUnits(u); })
      .catch(() => { if (!cancelled) setUnits([]); });
    return () => { cancelled = true; };
  }, [lat, lng]);

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: 'hsla(240,30%,6%,0.96)',
        border: '1.5px solid hsla(150,70%,50%,0.5)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px hsla(240,40%,4%,0.6)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Mountain size={13} className="text-emerald-400" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
          Geology Beneath You
        </span>
        <span className="ml-auto text-[8px] text-white/25 uppercase tracking-wider">Macrostrat</span>
        {onClose && (
          <button onClick={onClose} className="ml-2 text-white/30 hover:text-white/70 transition">
            <X size={14} />
          </button>
        )}
      </div>

      {units === null && (
        <div className="flex items-center gap-2 text-white/40 text-[11px] py-1">
          <Loader2 size={12} className="animate-spin" /> Reading the bedrock…
        </div>
      )}

      {units?.length === 0 && (
        <p className="text-white/35 text-[11px]">No mapped bedrock units at this location.</p>
      )}

      {units?.length > 0 && (
        <div className="space-y-2 max-h-44 overflow-y-auto">
          {units.slice(0, 3).map((u) => (
            <div key={u.map_id} className="border-l-4 pl-2.5" style={{ borderColor: u.color || '#34d399' }}>
              <div className="text-white text-[14px] font-bold leading-tight">
                {u.name || u.strat_name || 'Unnamed unit'}
              </div>
              <div className="text-[12px] text-emerald-300 font-mono font-semibold mt-0.5">
                {[u.age, u.lith].filter(Boolean).join(' · ')}
              </div>
              {u.descrip && (
                <p className="text-white/70 text-[11px] mt-0.5 leading-snug line-clamp-2">{u.descrip}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}