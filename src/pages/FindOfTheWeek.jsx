import React from 'react';
import WeeklyBallot from '@/components/live/WeeklyBallot.jsx';
import { Trophy } from 'lucide-react';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';

export default function FindOfTheWeek() {
  useSeoRobots(true);
  useSeoMeta(
    'Find of the Week — vote on rare rockhound finds',
    'Vote for the rarest confirmed finds of the week and see what collectors are pulling from the field.',
  );
  return (
    <div className="w-full max-w-md mx-auto px-3 pb-28 pt-3">
      <div className="mb-4">
        <h1 className="text-lg font-black text-white tracking-tight leading-none flex items-center gap-2">
          <Trophy size={18} className="text-amethyst-glow" /> Find of the Week
        </h1>
        <p className="text-white/55 text-[9px] uppercase tracking-[0.22em] mt-1">
          Rarest confirmed finds · vote for your favorite
        </p>
      </div>
      <WeeklyBallot />
    </div>
  );
}