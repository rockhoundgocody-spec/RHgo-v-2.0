import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { useEntityList } from '@/lib/useEntityQuery.js';
import IntroCinematic from '@/components/hub/IntroCinematic.jsx';
import OpeningBuffer from '@/components/hub/OpeningBuffer.jsx';
import NextUnlockNudge from '@/components/progression/NextUnlockNudge.jsx';
import CrawlAtlas from '@/components/progression/CrawlAtlas.jsx';
import { useFeatureProgression } from '@/lib/useFeatureProgression';

const LAND_LABEL = {
  public: 'public', blm: 'public', forest_service: 'public',
  state_park: 'fee', private: 'private', unknown: 'public',
};

export default function Hub() {
  const [bufferDone, setBufferDone] = useState(() => localStorage.getItem('rhgo_buffer_seen') === '1');
  const [showCinematic, setShowCinematic] = useState(() => !localStorage.getItem('rhgo_intro_seen'));
  const [user, setUser] = useState(null);
  const [hotspot, setHotspot] = useState(null);
  const { data: specimens = [] } = useEntityList('Specimen', '-found_date');
  const { next, remaining, xpNeededFor, level, crawled, score } = useFeatureProgression();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Hotspot.list('-trust_score', 1)
      .then(h => setHotspot(h[0]))
      .catch(() => {});
  }, []);

  if (!bufferDone) {
    return <OpeningBuffer onDone={() => { localStorage.setItem('rhgo_buffer_seen', '1'); setBufferDone(true); }} />;
  }
  if (showCinematic) {
    return <IntroCinematic onDone={() => { localStorage.setItem('rhgo_intro_seen', '1'); setShowCinematic(false); }} />;
  }

  const lastThree = specimens.filter(s => s.image_url).slice(0, 3);
  const huntLine = hotspot
    ? `${hotspot.state || 'US'} · ${LAND_LABEL[hotspot.land_type] || 'public'}${hotspot.access_notes ? ' · ' + hotspot.access_notes.split('.')[0].toLowerCase().trim() : ''}`
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a14' }}>
      <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,0px),20px)]">
        <span className="text-white font-bold text-base tracking-tight">RockHound-GO</span>
        <Link
          to="/profile"
          aria-label="Profile"
          className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95"
          style={{ border: '1px solid hsla(0,0%,100%,0.15)', background: 'hsla(0,0%,100%,0.03)' }}
        >
          <span className="text-white/60 text-xs font-bold uppercase">
            {(user?.full_name || user?.email || 'You')[0]}
          </span>
        </Link>
      </header>

      <div className="flex justify-center mt-14">
        <Link
          to="/scan"
          className="flex items-center gap-2.5 px-12 py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.18em] transition-all active:scale-95"
          style={{
            background: '#9FE8D0',
            color: '#0a0a14',
            boxShadow: '0 0 40px -8px rgba(159,232,208,0.5)',
          }}
        >
          <ScanLine size={18} strokeWidth={2.5} />
          Scan
        </Link>
      </div>

      {score.total > 0 && (
        <p className="text-center text-white/30 text-[10px] uppercase tracking-[0.2em] mt-4">
          Atlas {score.crawled}/{score.total} crawled
        </p>
      )}

      <NextUnlockNudge next={next} remaining={remaining} xpNeededFor={xpNeededFor} />

      <section className="px-5 mt-12">
        <h2 className="text-white/35 text-[10px] font-medium uppercase tracking-[0.22em] mb-2">Today</h2>
        {hotspot ? (
          <Link to="/explore" className="block">
            <div className="text-white font-semibold text-[15px] leading-tight">{hotspot.name}</div>
            <div className="text-white/45 text-[12px] mt-0.5 capitalize">{huntLine}</div>
          </Link>
        ) : (
          <div className="text-white/30 text-[12px]">Loading…</div>
        )}
      </section>

      <section className="px-5 mt-8">
        <h2 className="text-white/35 text-[10px] font-medium uppercase tracking-[0.22em] mb-2">Cabinet</h2>
        {lastThree.length > 0 ? (
          <div className="flex gap-2">
            {lastThree.map(s => (
              <Link key={s.id} to={`/specimen/${s.id}`}>
                <img
                  src={s.image_url}
                  alt={s.mineral_name || 'specimen'}
                  className="w-[88px] h-[88px] rounded-xl object-cover border border-white/10"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-white/30 text-[12px]">Scan your first specimen</div>
        )}
      </section>

      <CrawlAtlas level={level} crawled={crawled} />
    </div>
  );
}
