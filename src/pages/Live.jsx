import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Radio, Glasses, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StreamCard from '@/components/live/StreamCard.jsx';
import BroadcastStudio from '@/components/live/BroadcastStudio.jsx';
import usePageVisible from '@/lib/usePageVisible';

export default function Live() {
  const [me, setMe] = useState(null);
  const [streams, setStreams] = useState(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const pageVisible = usePageVisible();

  useEffect(() => {
    let alive = true;
    const load = () => base44.entities.LiveStream
      .filter({ status: 'live' }, '-created_date', 30)
      .then((list) => { if (alive) setStreams(list); });
    load();
    // Only poll while the tab is visible — saves battery and backend calls.
    let t;
    if (pageVisible) {
      t = setInterval(load, 10000);
    }
    return () => { alive = false; if (t) clearInterval(t); };
  }, [studioOpen, pageVisible]);

  return (
    <div className="w-full max-w-md mx-auto px-3 pb-28 pt-3">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">Live Field Feed</h1>
          <p className="text-white/55 text-[9px] uppercase tracking-[0.22em] mt-1">
            Glasses · Live AI ID · Chat
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!studioOpen && (
            <Link
              to="/find-of-the-week"
              className="h-9 px-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] flex items-center text-amethyst-glow"
              style={{ border: '1px solid hsla(280,100%,70%,0.4)' }}
            >
              <Trophy size={13} className="mr-1.5" /> Find of the Week
            </Link>
          )}
          {!studioOpen && (
            <Button
              onClick={() => (me ? setStudioOpen(true) : (window.location.href = '/login'))}
              className="h-9 px-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] text-white"
              style={{ background: 'linear-gradient(135deg, hsla(0,75%,45%,0.9), hsla(340,90%,55%,0.75))' }}
            >
              <Radio size={13} className="mr-1.5" /> Go Live
            </Button>
          )}
        </div>
      </div>

      {studioOpen ? (
        <BroadcastStudio me={me} coords={coords} onClose={() => setStudioOpen(false)} />
      ) : streams === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl aspect-video animate-pulse" style={{ background: 'hsla(220,40%,10%,0.6)' }} />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="rounded-2xl px-5 py-10 text-center" style={{ background: 'hsla(220,40%,6%,0.6)', border: '1px solid hsla(270,30%,25%,0.3)' }}>
          <Glasses size={30} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/70 text-sm font-semibold">No one is live right now</p>
          <p className="text-white/40 text-xs mt-1.5">
            Connect your AI glasses as a camera and broadcast your hunt — viewers see every AI identification as you make it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {streams.map((s) => <StreamCard key={s.id} stream={s} />)}
        </div>
      )}
    </div>
  );
}