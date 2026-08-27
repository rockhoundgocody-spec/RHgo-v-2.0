import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CompanionProgressDashboard from '@/components/hub/CompanionProgressDashboard.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';
import { SkeletonList } from '@/components/visuals/SkeletonCard.jsx';
import CloverFieldBackground from '@/components/companion/CloverFieldBackground.jsx';

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
    <div className="relative min-h-screen">
      <CloverFieldBackground />
      <div className="relative px-4 pt-6 max-w-2xl mx-auto space-y-6"
        style={{ zIndex: 10, paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div className="mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30 mb-1">Field Companion</div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white tracking-tight">Clover 🍀</h1>
        </div>
        {companion && (
          <p className="text-white/35 text-xs mt-1">
            Level {companion.level || 1} · {companion.streak_days || 0}-day streak · {companion.xp || 0} XP
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <>
          <DailyCheckIn companion={companion} onCheckedIn={(updated) => setCompanion(updated)} />
          <CompanionProgressDashboard companion={companion} />
        </>
      )}
      </div>
    </div>
  );
}