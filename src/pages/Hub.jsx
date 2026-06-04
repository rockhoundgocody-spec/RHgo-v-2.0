import React, { useState, useEffect } from 'react';
import { flushWhenStable } from '@/lib/offlineQueue.js';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import useCompanion from '@/lib/useCompanion.js';
import CompanionMilestoneToast from '@/components/hub/CompanionMilestoneToast.jsx';
import SpecimenTypeChart from '@/components/hub/SpecimenTypeChart.jsx';
import QuestEngine from '@/components/hub/QuestEngine.jsx';
import { base44 } from '@/api/base44Client';

export default function Hub() {
  const [milestone, setMilestone] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const { companion, todaysSpecimenCount } = useCompanion({
    onMilestone: setMilestone,
  });

  useEffect(() => {
    flushWhenStable();
    base44.auth.me().then((u) => { if (u?.email) setUserEmail(u.email); }).catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-5">
      {/* Ambient purple backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[520px] -z-10"
        style={{
          background: 'radial-gradient(60% 50% at 50% 0%, hsla(280,90%,50%,0.2) 0%, transparent 70%)',
        }}
      />

      {/* ── HERO CENTERPIECE ── */}
      <section className="flex flex-col items-center text-center">
        <HeroOrb companion={companion} todaysSpecimens={todaysSpecimenCount} />

        <div className="mt-6 select-none">
          <span
            className="text-[80px] sm:text-[100px] font-black leading-none text-amethyst-glow glow-amethyst block"
            style={{
              letterSpacing: '-0.02em',
              textShadow: '0 0 60px hsla(280,100%,75%,0.7), 0 0 120px hsla(265,80%,50%,0.4)',
            }}
          >
            GO
          </span>
          <p className="mt-2 text-white/40 text-sm font-light tracking-[0.18em] uppercase">
            Discover · Identify · Collect
          </p>
        </div>
      </section>

      <div className="w-full max-w-md mt-8 pb-24 space-y-4">
        {userEmail && <QuestEngine userEmail={userEmail} />}
        <SpecimenTypeChart />
      </div>

      <CompanionMilestoneToast notification={milestone} onDismiss={() => setMilestone(null)} />
    </div>
  );
}