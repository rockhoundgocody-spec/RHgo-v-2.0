import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import FindsSummary from '@/components/dashboard/FindsSummary.jsx';
import RarityDistribution from '@/components/dashboard/RarityDistribution.jsx';
import UpcomingQuests from '@/components/dashboard/UpcomingQuests.jsx';

export default function Dashboard() {
  const [specimens, setSpecimens] = useState(null);
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    base44.entities.Specimen.list('-found_date').then(setSpecimens).catch(() => setSpecimens([]));
    base44.entities.Quest.filter({ status: 'active' }, 'expires_at', 5)
      .then(setQuests).catch(() => {});
  }, []);

  if (specimens === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-6 pb-28 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Progress</h1>
        <p className="text-white/50 text-[10px] uppercase tracking-[0.22em] mt-0.5">
          Your journey at a glance
        </p>
      </div>
      <FindsSummary specimens={specimens} />
      <RarityDistribution specimens={specimens} />
      <UpcomingQuests quests={quests} />
    </div>
  );
}