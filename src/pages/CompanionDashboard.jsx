import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CompanionProgressDashboard from '@/components/hub/CompanionProgressDashboard.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';

export default function CompanionDashboard() {
  const [companion, setCompanion] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getCompanionState', {})
      .then((res) => setCompanion(res?.data?.companion || null))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70 mb-2">
        Companion
      </div>
      <DailyCheckIn companion={companion} onCheckedIn={(updated) => setCompanion(updated)} />
      <CompanionProgressDashboard companion={companion} />
    </div>
  );
}