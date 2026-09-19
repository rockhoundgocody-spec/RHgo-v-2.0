import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, MapPin, Compass, Flame } from 'lucide-react';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import HubAtmosphere from '@/components/hub/HubAtmosphere.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';
import CloverSuggests from '@/components/hub/CloverSuggests.jsx';
import SeasonBanner from '@/components/hub/SeasonBanner.jsx';
import DailyRoulette from '@/components/hub/DailyRoulette.jsx';
import NewUserTour from '@/components/hub/NewUserTour.jsx';
import StreakAtRiskCard from '@/components/hub/StreakAtRiskCard.jsx';
import WeeklyDigestCard from '@/components/hub/WeeklyDigestCard.jsx';
import IntentionRoulette from '@/components/hub/IntentionRoulette.jsx';
import { getLevel, getTitle, xpProgress, xpToNext } from '@/lib/leveling';
import { toast } from '@/components/ui/use-toast';
import { reclaimGuestReport } from '@/lib/reclaimGuestReport';
import { formatDistance, rankHotspots, watchGps } from '@/lib/geo';

const LAND_LABEL = {
  public: 'public', blm: 'public', forest_service: 'public',
  state_park: 'fee', private: 'private', unknown: 'public',
};

export default function Hub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [profile, setProfile] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [gps, setGps] = useState(null);
  const [collected, setCollected] = useState(new Set());

  useEffect(() => watchGps(setGps), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (cancelled) return;
        setUser(u);
        if (u?.email) {
          const [profiles, specimens] = await Promise.all([
            base44.entities.PlayerProfile.filter({ owner_email: u.email }).catch(() => []),
            base44.entities.Specimen.list('-found_date', 80).catch(() => []),
          ]);
          if (cancelled) return;
          setProfile(profiles?.[0] || null);
          setCollected(new Set(
            (specimens || []).map((s) => (s.mineral_name || '').toLowerCase().trim()).filter(Boolean),
          ));
        }
      } catch {
        /* unauthenticated hub is handled by HomeGate */
      }
    })();

    base44.entities.Hotspot.list('-trust_score', 80)
      .then((h) => { if (!cancelled) setHotspots(h || []); })
      .catch(() => {});

    base44.functions.invoke('getCompanionState', {})
      .then((res) => { if (!cancelled) setCompanion(res?.data?.companion || null); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    try {
      if (sessionStorage.getItem('rhgo_guest_reclaim_done') === '1') return;
      sessionStorage.setItem('rhgo_guest_reclaim_done', '1');
    } catch {
      /* private mode */
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
        /* stash preserved on hard failure */
      }
    })();
    return () => { cancelled = true; };
  }, [user?.email, navigate]);

  const ranked = useMemo(
    () => rankHotspots(hotspots, { userLocation: gps, collectedMinerals: collected }),
    [hotspots, gps, collected],
  );
  const nearby = ranked.filter((h) => h.distanceMi == null || h.distanceMi <= 80).slice(0, 3);
  const picks = nearby.length ? nearby : ranked.slice(0, 3);

  const totalXp = profile?.total_xp || 0;
  const level = getLevel(totalXp);
  const title = getTitle(level);
  const progress = xpProgress(totalXp);
  const remaining = xpToNext(totalXp);

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: '#0a0a14' }}>
      <HubAtmosphere />
      <NewUserTour />
      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,0px),20px)]">
        <div>
          <div className="text-[9px] uppercase tracking-[0.28em] text-white/35 font-semibold">Field OS</div>
          <span className="text-white font-bold text-base tracking-tight">RockHound-GO</span>
        </div>
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

      <div className="relative z-10 flex justify-center mt-3">
        <div className="relative">
          <div className="absolute inset-0 -m-6 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, hsla(280,100%,60%,0.18), transparent 70%)', filter: 'blur(8px)' }} />
          <HeroOrb companion={companion || profile} size={168} />
        </div>
      </div>

      <section className="relative z-10 px-5 mt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-white font-bold text-[13px] tracking-tight">{title}</span>
          <span className="text-white/40 text-[11px] tabular-nums">
            {remaining > 0 ? `${remaining} XP to next` : 'Max level'}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
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

      <div className="relative z-10 flex justify-center mt-6">
        <Link
          to="/scan"
          className="flex items-center gap-2.5 px-12 py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.18em] transition-all active:scale-95 mint-cta"
          style={{ animation: 'orb-ring 2.8s ease-in-out infinite' }}
        >
          <ScanLine size={18} strokeWidth={2.5} />
          Scan
        </Link>
      </div>

      <section className="relative z-10 px-5 mt-7 space-y-3">
        <StreakAtRiskCard companion={companion} />
        <DailyCheckIn companion={companion} onCheckedIn={(updated) => setCompanion((prev) => ({ ...prev, ...updated, last_check_in_date: new Date().toISOString().slice(0, 10) }))} />
        <SeasonBanner />
      </section>

      <section className="relative z-10 px-5 mt-4">
        <CloverSuggests gps={gps} />
      </section>

      <section className="relative z-10 px-5 mt-4 space-y-3">
        <DailyRoulette />
        <IntentionRoulette />
      </section>

      <section className="relative z-10 px-5 mt-4">
        <WeeklyDigestCard />
      </section>

      <section className="relative z-10 px-5 mt-5 pb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white/35 text-[10px] font-medium uppercase tracking-[0.22em]">
            {gps ? 'Hunts near you' : 'Today'}
          </h2>
          <Link to="/explore" className="text-[11px] text-[#9FE8D0]/80 flex items-center gap-1">
            <Compass size={11} /> Map
          </Link>
        </div>

        {picks.length === 0 ? (
          <div className="page-card px-4 py-3 text-white/35 text-[12px]">Looking for a hunt nearby…</div>
        ) : (
          <div className="space-y-2">
            {picks.map((spot, i) => (
              <Link
                key={spot.id || spot.name}
                to={`/explore?spot=${encodeURIComponent(spot.id || spot.name)}`}
                className="page-card block px-4 py-3 transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-[14px] leading-tight truncate">{spot.name}</div>
                    <div className="text-white/45 text-[11px] mt-0.5 capitalize truncate">
                      {spot.state || 'US'} · {LAND_LABEL[spot.land_type] || 'public'}
                      {spot.gapCount > 0 ? ` · ${spot.gapCount} new minerals` : ''}
                    </div>
                    {spot.minerals?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {spot.minerals.slice(0, 3).map((m) => (
                          <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full text-[#c084fc]"
                            style={{ background: 'hsla(265,40%,20%,.55)', border: '1px solid hsla(265,60%,50%,.2)' }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {spot.distanceMi != null && (
                      <div className="text-[#9FE8D0] text-[11px] font-bold tabular-nums flex items-center gap-1">
                        <MapPin size={10} /> {formatDistance(spot.distanceMi)}
                      </div>
                    )}
                    {i === 0 && (
                      <div className="text-[9px] uppercase tracking-wider text-amber-300/80 mt-1 flex items-center justify-end gap-1">
                        <Flame size={9} /> Best pick
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <Link to="/quests" className="text-[11px] uppercase tracking-[0.16em] text-amethyst-glow/80">Quests</Link>
          <Link to="/find-of-the-week" className="text-[11px] uppercase tracking-[0.16em] text-amethyst-glow/80">Vote</Link>
          <Link to="/companion" className="text-[11px] uppercase tracking-[0.16em] text-amethyst-glow/80">Clover</Link>
          <Link to="/collections" className="text-[11px] uppercase tracking-[0.16em] text-amethyst-glow/80">Albums</Link>
          <Link to="/badges" className="text-[11px] uppercase tracking-[0.16em] text-amethyst-glow/80">Badges</Link>
        </div>
      </section>
    </div>
  );
}
