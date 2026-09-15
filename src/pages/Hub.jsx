import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import { getLevel, getTitle, xpProgress, xpToNext } from '@/lib/leveling';
import { toast } from '@/components/ui/use-toast';
import { reclaimGuestReport } from '@/lib/reclaimGuestReport';

const LAND_LABEL = {
  public: 'public', blm: 'public', forest_service: 'public',
  state_park: 'fee', private: 'private', unknown: 'public',
};

export default function Hub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hotspot, setHotspot] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Hotspot.list('-trust_score', 1)
      .then(h => setHotspot(h[0]))
      .catch(() => {});
    // Load player profile for XP
    base44.auth.me().then(u => {
      if (!u?.email) return;
      base44.entities.PlayerProfile.filter({ owner_email: u.email })
        .then(p => setProfile(p[0] || null))
        .catch(() => {});
    }).catch(() => {});
  }, []);

  // Once per browser session after auth: sync any stashed guest find
  useEffect(() => {
    if (!user?.email) return;
    try {
      if (sessionStorage.getItem('rhgo_guest_reclaim_done') === '1') return;
      sessionStorage.setItem('rhgo_guest_reclaim_done', '1');
    } catch {
      /* private mode — still attempt once via in-memory guard below */
    }
    let cancelled = false;
    (async () => {
      try {
        const out = await reclaimGuestReport();
        if (cancelled || !out?.synced) return;
        toast({
          title: 'Synced your guest find.',
          description: out.mineralName || undefined,
        });
        if (out.specimenId) navigate(`/specimen/${out.specimenId}`);
        else navigate('/collection');
      } catch {
        /* best-effort — stash re-preserved by helper on hard failure */
      }
    })();
    return () => { cancelled = true; };
  }, [user?.email, navigate]);

  const totalXp = profile?.total_xp || 0;
  const level = getLevel(totalXp);
  const title = getTitle(level);
  const progress = xpProgress(totalXp);
  const remaining = xpToNext(totalXp);

  const huntLine = hotspot
    ? `${hotspot.state || 'US'} · ${LAND_LABEL[hotspot.land_type] || 'public'}${hotspot.access_notes ? ' · ' + hotspot.access_notes.split('.')[0].toLowerCase().trim() : ''}`
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a14' }}>
      {/* Header — logo + profile only */}
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

      {/* Clover — she's home when you're home */}
      <div className="flex justify-center mt-6">
        <HeroOrb companion={profile} size={120} />
      </div>

      {/* XP / Level — the progression anchor */}
      <section className="px-5 mt-5">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-white font-bold text-[13px] tracking-tight">{title}</span>
          <span className="text-white/40 text-[11px] tabular-nums">
            {remaining > 0 ? `${remaining} XP to next` : 'Max level'}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsla(275,80%,60%,0.8), hsla(280,100%,75%,0.95))',
              boxShadow: '0 0 12px hsla(280,100%,70%,0.4)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/30 text-[10px] uppercase tracking-[0.18em]">Level {level}</span>
          <span className="text-white/30 text-[10px] tabular-nums">{totalXp.toLocaleString()} XP</span>
        </div>
      </section>

      {/* Scan — the only mint element */}
      <div className="flex justify-center mt-7">
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

      {/* Today's hunt */}
      <section className="px-5 mt-10">
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
    </div>
  );
}