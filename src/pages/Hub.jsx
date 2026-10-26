import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import HubAtmosphere from '@/components/hub/HubAtmosphere.jsx';
import { toast } from '@/components/ui/use-toast';
import { reclaimGuestReport } from '@/lib/reclaimGuestReport';

/**
 * Hub — the home screen, and nothing but Clover.
 *
 * The bottom dock is the way to the rest of the kit, so this screen stays one
 * thing: her, listening. She still needs the companion state (her level grows
 * the orb) and the hunter's recent finds (so a short, noisy field sentence like
 * "what about that one" has something to point at).
 */
export default function Hub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [recentFinds, setRecentFinds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (cancelled) return;
        setUser(u);
        if (u?.email) {
          const specimens = await base44.entities.Specimen.list('-found_date', 12).catch(() => []);
          if (cancelled) return;
          setRecentFinds((specimens || []).map((s) => s.mineral_name).filter(Boolean));
        }
      } catch {
        /* unauthenticated home is handled by HomeGate */
      }
    })();

    base44.functions.invoke('getCompanionState', {})
      .then((res) => { if (!cancelled) setCompanion(res?.data?.companion || null); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    try {
      if (sessionStorage.getItem('rhgo_guest_reclaim_done') === '1') return;
    } catch {
      /* private mode */
    }
    let cancelled = false;
    (async () => {
      try {
        const out = await reclaimGuestReport();
        if (cancelled || !out?.synced) return;
        try {
          sessionStorage.setItem('rhgo_guest_reclaim_done', '1');
        } catch {
          /* private mode */
        }
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

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0a0a14' }}
    >
      <HubAtmosphere />

      <div className="relative z-10 w-full flex flex-col items-center px-4">
        <div className="relative">
          <div
            className="absolute inset-0 -m-10 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsla(190,100%,62%,0.16), hsla(165,80%,55%,0.06) 55%, transparent 72%)',
              filter: 'blur(10px)',
            }}
          />
          <HeroOrb companion={companion} recentFinds={recentFinds} size={232} />
        </div>
      </div>
    </div>
  );
}