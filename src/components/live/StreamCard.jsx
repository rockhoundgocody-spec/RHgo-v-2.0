import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Sparkles, Glasses, Radio } from 'lucide-react';

export default function StreamCard({ stream }) {
  const isLive = stream.status === 'live';
  return (
    <Link
      to={`/live/${stream.id}`}
      className="block rounded-2xl overflow-hidden transition hover:scale-[1.01]"
      style={{ background: 'hsla(220,40%,6%,0.7)', border: '1px solid hsla(270,30%,28%,0.35)' }}
    >
      <div className="relative aspect-video bg-black/60">
        {stream.current_frame_url ? (
          <img src={stream.current_frame_url} alt={stream.title || 'stream'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Glasses size={28} className="text-white/20" />
          </div>
        )}
        {isLive && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white"
            style={{ background: 'hsla(0,80%,45%,0.9)' }}>
            <Radio size={8} /> Live
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-white/90 truncate">{stream.title || 'Field stream'}</div>
        <div className="text-white/45 text-[11px] mt-0.5 truncate">
          {stream.host_name}{stream.device_label ? ` · ${stream.device_label}` : ''}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/40">
          <span className="flex items-center gap-1"><Eye size={9} /> {stream.viewer_count || 0}</span>
          <span className="flex items-center gap-1"><Sparkles size={9} /> {stream.id_count || 0} IDs</span>
        </div>
      </div>
    </Link>
  );
}