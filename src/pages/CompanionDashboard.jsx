import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CompanionProgressDashboard from '@/components/hub/CompanionProgressDashboard.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';
import { SkeletonList } from '@/components/visuals/SkeletonCard.jsx';

const MOOD_META = {
  radiant: { color: 'hsl(45,100%,70%)',  glow: 'hsla(45,100%,60%,0.4)',  label: 'Radiant ✨' },
  happy:   { color: 'hsl(160,70%,60%)',  glow: 'hsla(160,70%,50%,0.4)',  label: 'Happy 🌿' },
  calm:    { color: 'hsl(210,80%,70%)',  glow: 'hsla(210,80%,60%,0.35)', label: 'Calm 🌊' },
  drowsy:  { color: 'hsl(270,50%,70%)',  glow: 'hsla(270,50%,55%,0.3)',  label: 'Drowsy 🌙' },
  tender:  { color: 'hsl(340,70%,70%)',  glow: 'hsla(340,70%,55%,0.35)', label: 'Tender 🌸' },
};

export default function CompanionDashboard() {
  const [companion, setCompanion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions.invoke('getCompanionState', {})
      .then((res) => setCompanion(res?.data?.companion || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mood = MOOD_META[companion?.mood] || MOOD_META.calm;

  return (
    <div className="min-h-screen px-4 pt-6 max-w-2xl mx-auto space-y-6"
      style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div className="mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30 mb-1">Field Companion</div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white tracking-tight">Clover 🍀</h1>
          {companion && (
            <div className="text-[10px] font-bold px-3 py-1 rounded-full"
              style={{ background: `${mood.glow.replace(/[\d.]+\)$/, '0.15)')}`, color: mood.color, border: `1px solid ${mood.glow.replace(/[\d.]+\)$/, '0.3)')}` }}>
              {mood.label}
            </div>
          )}
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
  );
}