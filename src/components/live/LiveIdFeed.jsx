import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';

const RARITY_COLOR = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#38bdf8',
  legendary: '#a78bfa',
};

export default function LiveIdFeed({ streamId }) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!streamId) return;
    let alive = true;
    base44.entities.StreamIdentification
      .filter({ stream_id: streamId }, '-created_date', 30)
      .then((list) => { if (alive) setIds(list); });

    const unsub = base44.entities.StreamIdentification.subscribe((event) => {
      if (event.type !== 'create' || event.data?.stream_id !== streamId) return;
      setIds((prev) => (prev.some((x) => x.id === event.data.id) ? prev : [event.data, ...prev]));
    });
    return () => { alive = false; unsub(); };
  }, [streamId]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'hsla(220,40%,5%,0.7)', border: '1px solid hsla(270,30%,25%,0.3)' }}>
      <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 border-b border-white/5">
        <Sparkles size={10} /> Live identifications
      </div>
      <div className="max-h-56 overflow-y-auto p-2 space-y-2">
        {ids.length === 0 && (
          <p className="text-white/30 text-xs text-center py-4">No identifications yet this stream.</p>
        )}
        {ids.map((x) => {
          const color = RARITY_COLOR[x.rarity] || RARITY_COLOR.common;
          return (
            <div key={x.id} className="flex gap-2.5 p-2 rounded-xl" style={{ background: 'hsla(220,30%,9%,0.6)', border: `1px solid ${color}33` }}>
              {x.image_url && (
                <img src={x.image_url} alt={x.mineral_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white/90 truncate">{x.mineral_name}</div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color }}>
                  {x.rarity} · {Math.round((x.confidence || 0) * 100)}%
                </div>
                {x.description && (
                  <p className="text-white/50 text-[10px] mt-1 line-clamp-2">{x.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}