import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Loader2, Check, FolderOpen } from 'lucide-react';

const RARITY_COLOR = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#38bdf8',
  legendary: '#a78bfa',
};

/**
 * The host's draft list: every identification made during this stream, each with a
 * Promote button that pins the stream's exact GPS to the private collection map.
 * Promoted drafts are marked so they can't be re-pinned.
 */
export default function DraftList({ stream, me }) {
  const [ids, setIds] = useState([]);
  const [promoting, setPromoting] = useState(null);

  useEffect(() => {
    if (!stream?.id) return;
    let alive = true;
    base44.entities.StreamIdentification
      .filter({ stream_id: stream.id }, '-created_date', 50)
      .then((list) => { if (alive) setIds(list); });
    const unsub = base44.entities.StreamIdentification.subscribe((event) => {
      if (!event.data || event.data.stream_id !== stream.id) return;
      if (event.type === 'create') {
        setIds((prev) => (prev.some((x) => x.id === event.data.id) ? prev : [event.data, ...prev]));
      } else if (event.type === 'update') {
        setIds((prev) => prev.map((x) => x.id === event.data.id ? { ...x, ...event.data } : x));
      }
    });
    return () => { alive = false; unsub(); };
  }, [stream?.id]);

  const promote = async (x) => {
    if (!stream?.lat || !stream?.lng || x.promoted) return;
    setPromoting(x.id);
    try {
      const log = await base44.entities.PrivateRockLog.create({
        owner_email: me.email,
        mineral_name: x.mineral_name,
        image_url: x.image_url,
        lat: stream.lat,
        lng: stream.lng,
        rarity: x.rarity,
        found_date: new Date().toISOString().slice(0, 10),
        location_label: stream.title || 'Live stream find',
      });
      await base44.entities.StreamIdentification.update(x.id, {
        promoted: true,
        private_log_id: log.id,
      });
      setIds((prev) => prev.map((p) => p.id === x.id ? { ...p, promoted: true, private_log_id: log.id } : p));
    } finally {
      setPromoting(null);
    }
  };

  if (ids.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'hsla(220,40%,5%,0.7)', border: '1px solid hsla(270,30%,25%,0.3)' }}>
      <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 border-b border-white/5">
        <FolderOpen size={10} /> Drafts · promote to private map
      </div>
      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
        {ids.map((x) => {
          const color = RARITY_COLOR[x.rarity] || RARITY_COLOR.common;
          const noGps = !stream?.lat || !stream?.lng;
          return (
            <div key={x.id} className="flex gap-2.5 p-2 rounded-xl" style={{ background: 'hsla(220,30%,9%,0.6)', border: `1px solid ${color}33` }}>
              {x.image_url && <img src={x.image_url} alt={x.mineral_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white/90 truncate">{x.mineral_name}</div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color }}>{x.rarity} · {Math.round((x.confidence || 0) * 100)}%</div>
                {x.promoted ? (
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400"><Check size={10} /> Pinned to private map</div>
                ) : noGps ? (
                  <div className="text-[10px] text-white/30 mt-1">No GPS on this stream</div>
                ) : null}
              </div>
              {!x.promoted && (
                <button
                  onClick={() => promote(x)}
                  disabled={noGps || promoting === x.id}
                  className="self-center shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-30 flex items-center gap-1"
                  style={{ background: color + '22', color, border: `1px solid ${color}55` }}
                >
                  {promoting === x.id ? <Loader2 size={11} className="animate-spin" /> : <><MapPin size={10} /> Pin</>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}