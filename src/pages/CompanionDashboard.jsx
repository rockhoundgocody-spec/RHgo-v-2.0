import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CompanionProgressDashboard from '@/components/hub/CompanionProgressDashboard.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';

export default function CompanionDashboard() {
  const [companion, setCompanion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions.invoke('getCompanionState', {})
      .then((res) => setCompanion(res?.data?.companion || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70 mb-2">
        Companion
      </div>
      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst-glow rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <DailyCheckIn companion={companion} onCheckedIn={(updated) => setCompanion(updated)} />
          <CompanionProgressDashboard companion={companion} />
        </>
      )}
    </div>
  );
}