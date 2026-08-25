import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Check, Loader2 } from 'lucide-react';

const RARITY_COLOR = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#38bdf8',
  legendary: '#a78bfa',
};

/**
 * Live identification feed for a stream. When isHost is true, each card shows a
 * Confirm button so the host can mark a 70%+ find eligible for the Find of the
 * Week ballot. Confirmed finds get a rarity-colored check.
 */
export default function LiveIdFeed({ streamId, isHost }) {
  const [ids, setIds] = useState([]);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    if (!streamId) return;
    let alive = true;
    base44.entities.StreamIdentification
      .filter({ stream_id: streamId }, '-created_date', 30)
      .then((list) => { if (alive) setIds(list); });

    const unsub = base44.entities.StreamIdentification.subscribe((event) => {
      if (!event.data || event.data.stream_id !== streamId) return;
      if (event.type === 'create') {
        setIds((prev) => (prev.some((x) => x.id === event.data.id) ? prev : [event.data, ...prev]));
      } else if (event.type === 'update') {
        setIds((prev) => prev.map((x) => x.id === event.data.id ? { ...x, ...event.data } : x));
      }
    });
    return () => { alive = false; unsub(); };
  }, [streamId]);

  const confirm = async (id) => {
    setConfirming(id);
    try {
      const res = await base44.functions.invoke('confirmStreamId', { id });
      if (res?.data?.identification) {
        setIds((prev) => prev.map((x) => x.id === id ? { ...x, ...res.data.identification } : x));
      }
    } finally {
      setConfirming(null);
    }
  };

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
          const eligible = (x.confidence || 0) >= 0.7;
          return (
            <div key={x.id} className="flex gap-2.5 p-2 rounded-xl" style={{ background: 'hsla(220,30%,9%,0.6)', border: `1px solid ${x.confirmed ? color + '66' : color + '33'}` }}>
              {x.image_url && (
                <img src={x.image_url} alt={x.mineral_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white/90 truncate">{x.mineral_name}</span>
                  {x.confirmed && <Check size={11} style={{ color }} />}
                </div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color }}>
                  {x.rarity} · {Math.round((x.confidence || 0) * 100)}%
                </div>
                {x.description && (
                  <p className="text-white/50 text-[10px] mt-1 line-clamp-2">{x.description}</p>
                )}
              </div>
              {isHost && !x.confirmed && (
                <button
                  onClick={() => confirm(x.id)}
                  disabled={!eligible || confirming === x.id}
                  className="self-center shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-30"
                  style={{ background: eligible ? color + '22' : 'hsla(220,30%,15%,0.6)', color: eligible ? color : '#fff', border: `1px solid ${color}55` }}
                  title={eligible ? 'Confirm for Find of the Week ballot' : 'Needs 70%+ confidence to confirm'}
                >
                  {confirming === x.id ? <Loader2 size={11} className="animate-spin" /> : 'Confirm'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}