import React, { useEffect, useState } from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { Flame, Zap } from 'lucide-react';

const MYSTERY_MINERALS = [
  { name: 'Bismuth', emoji: '🌈', fact: 'Forms rainbow staircase crystals unlike any other element.', rarity: 'rare' },
  { name: 'Herkimer Diamond', emoji: '💎', fact: 'Actually quartz — but double-terminated and crystal-clear.', rarity: 'rare' },
  { name: 'Moldavite', emoji: '🌿', fact: 'Born from a meteor impact 15 million years ago.', rarity: 'legendary' },
  { name: 'Labradorite', emoji: '🔮', fact: 'Flip it in light — a hidden aurora lives inside.', rarity: 'uncommon' },
  { name: 'Pyrite', emoji: '✨', fact: 'Fools Gold — but smarter than it looks. Electrical conductor.', rarity: 'common' },
  { name: 'Selenite', emoji: '🕯️', fact: 'Can grow up to 36 feet long inside Mexican caves.', rarity: 'uncommon' },
  { name: 'Rhodonite', emoji: '🌸', fact: 'Deep pink with black veins — emotion encoded in stone.', rarity: 'rare' },
  { name: 'Obsidian', emoji: '🖤', fact: 'Volcanic glass sharper than surgical steel.', rarity: 'uncommon' },
  { name: 'Amethyst', emoji: '💜', fact: 'Once worth more than diamonds before 1800s Brazilian discovery.', rarity: 'uncommon' },
  { name: 'Alexandrite', emoji: '🎭', fact: 'Appears green in daylight, red under incandescent. Two rocks in one.', rarity: 'legendary' },
  { name: 'Fluorite', emoji: '🌊', fact: 'Glows electric blue under UV — the OG glow-in-the-dark rock.', rarity: 'uncommon' },
  { name: 'Sunstone', emoji: '☀️', fact: 'Contains actual metallic copper flakes that shimmer like sunlight.', rarity: 'rare' },
];

const RARITY_COLORS = {
  common: '#94a3b8', uncommon: '#34d399', rare: '#38bdf8', legendary: '#a78bfa',
};

function getDayIndex() {
  const d = new Date();
  return (d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate()) % MYSTERY_MINERALS.length;
}

export default function DailyStreakCard({ companion }) {
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (companion?.streak_days) setStreak(companion.streak_days);
  }, [companion]);

  const mineral = MYSTERY_MINERALS[getDayIndex()];
  const color = RARITY_COLORS[mineral.rarity];

  return (
    <GlassPanel className="overflow-hidden">
      {/* Top stripe */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={13} className="text-orange-400" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-orange-300 font-bold">
              Daily Mystery Mineral
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-white/40">
            <Zap size={9} className="text-yellow-400" />
            {streak > 0 ? (
              <span className="text-yellow-300 font-bold">{streak} day streak!</span>
            ) : (
              <span>Start your streak</span>
            )}
          </div>
        </div>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full group relative flex flex-col items-center justify-center py-6 rounded-xl border border-dashed transition-all"
            style={{ borderColor: `${color}40`, background: `${color}08` }}
          >
            <div className="text-4xl mb-2 grayscale group-hover:grayscale-0 transition-all duration-300">
              ❓
            </div>
            <div className="text-[11px] uppercase tracking-[0.3em] font-bold"
              style={{ color }}>
              Tap to Reveal Today's Mineral
            </div>
            <div className="text-[10px] text-white/30 mt-1">
              {mineral.rarity} · learn something wild
            </div>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)` }} />
          </button>
        ) : (
          <div className="flex gap-3 items-start">
            <div className="text-3xl shrink-0">{mineral.emoji}</div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">{mineral.name}</div>
              <div className="text-[9px] uppercase tracking-[0.2em] font-semibold mb-1.5" style={{ color }}>
                {mineral.rarity}
              </div>
              <p className="text-white/55 text-[11px] leading-relaxed italic">
                "{mineral.fact}"
              </p>
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}