import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Radio, Eye, ArrowLeft, Glasses } from 'lucide-react';
import StreamChat from '@/components/live/StreamChat.jsx';
import LiveIdFeed from '@/components/live/LiveIdFeed.jsx';
import LiveIdOverlay from '@/components/live/LiveIdOverlay.jsx';
import AuctionPanel from '@/components/live/AuctionPanel.jsx';

export default function LiveStreamView() {
  const { streamId } = useParams();
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState(null);
  const [missing, setMissing] = useState(false);
  const [latestId, setLatestId] = useState(null);

  useEffect(() => { base44.auth.me().then(setMe).catch(() => setMe(null)); }, []);

  // Track the most recent AI identification for this stream to overlay on the feed.
  useEffect(() => {
    if (!streamId) return;
    let alive = true;
    base44.entities.StreamIdentification
      .filter({ stream_id: streamId }, '-created_date', 1)
      .then((list) => { if (alive && list[0]) setLatestId(list[0]); });
    const unsub = base44.entities.StreamIdentification.subscribe((event) => {
      if (event.type !== 'create' || event.data?.stream_id !== streamId) return;
      setLatestId(event.data);
    });
    return () => { alive = false; unsub(); };
  }, [streamId]);

  // Poll the stream record so the published frame stays current for viewers.
  useEffect(() => {
    if (!streamId) return;
    let alive = true;
    const load = () => base44.entities.LiveStream.get(streamId)
      .then((s) => { if (alive) setStream(s); })
      .catch(() => { if (alive) setMissing(true); });
    load();
    const t = setInterval(load, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [streamId]);

  // Count this viewer once on entry.
  useEffect(() => {
    if (!stream || stream.status !== 'live') return;
    let done = false;
    if (!done) {
      done = true;
      base44.entities.LiveStream
        .update(stream.id, { viewer_count: (stream.viewer_count || 0) + 1 })
        .catch(() => {});
    }
     
  }, [stream?.id]);

  if (missing) {
    return (
      <div className="w-full max-w-md mx-auto px-4 pt-10 text-center">
        <p className="text-white/70 text-sm">This stream is no longer available.</p>
        <Link to="/live" className="text-amethyst-glow text-xs mt-3 inline-block">Back to Live</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-3 pb-28 pt-3 space-y-3">
      <Link to="/live" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-amethyst-glow">
        <ArrowLeft size={12} /> Live
      </Link>

      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black"
        style={{ border: '1px solid hsla(280,100%,70%,0.25)' }}>
        {stream?.current_frame_url ? (
          <img src={stream.current_frame_url} alt="live view" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Glasses size={28} className="text-white/20" />
          </div>
        )}
        {stream?.status === 'live' ? (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white"
            style={{ background: 'hsla(0,80%,45%,0.9)' }}>
            <Radio size={8} /> Live
          </span>
        ) : stream ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white/70"
            style={{ background: 'hsla(220,30%,15%,0.9)' }}>
            Ended
          </span>
        ) : null}
        <LiveIdOverlay identification={latestId} />
      </div>

      <div>
        <h1 className="text-base font-black text-white leading-tight">{stream?.title || 'Field stream'}</h1>
        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-white/45">
          <span>{stream?.host_name}</span>
          {stream?.device_label && <span>{stream.device_label}</span>}
          <span className="flex items-center gap-1"><Eye size={9} /> {stream?.viewer_count || 0}</span>
        </div>
      </div>

      <LiveIdFeed streamId={streamId} />
      <AuctionPanel streamId={streamId} me={me} hostEmail={stream?.owner_email} />
      <StreamChat streamId={streamId} me={me} />
    </div>
  );
}