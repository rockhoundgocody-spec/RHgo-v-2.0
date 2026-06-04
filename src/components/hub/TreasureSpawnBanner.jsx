import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Pseudo-random but stable per day
const SPAWNS = [
  { mineral: 'Herkimer Diamond', distance: '1.4 mi', rarity: 'rare',      emoji: '💎', hint: 'Near a streambed' },
  { mineral: 'Fire Opal',        distance: '0.8 mi', rarity: 'legendary', emoji: '🔥', hint: 'Volcanic outcrop spotted' },
  { mineral: 'Bismuth Crystal',  distance: '2.1 mi', rarity: 'rare',      emoji: '🌈', hint: 'Old mining claim edge' },
  { mineral: 'Watermelon Tourmaline', distance: '3.0 mi', rarity: 'rare', emoji: '🍉', hint: 'Pegmatite field nearby' },
  { mineral: 'Amethyst Geode',   distance: '1.9 mi', rarity: 'uncommon',  emoji: '💜', hint: 'Limestone formation' },
];

const RARITY_COLORS = {
  uncommon: { bg: 'from-emerald-900/60 to-emerald-800/30', border: 'border-emerald-400/40', color: '#34d399' },
  rare:     { bg: 'from-sky-900/60 to-sky-800/30',         border: 'border-sky-400/40',     color: '#38bdf8' },
  legendary:{ bg: 'from-purple-900/60 to-fuchsia-800/30',  border: 'border-fuchsia-400/50', color: '#e879f9' },
};

function getDailySpawn() {
  const idx = (new Date().getDate() + new Date().getMonth() * 3) % SPAWNS.length;
  return SPAWNS[idx];
}

export default function TreasureSpawnBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const key = `spawn_dismissed_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;

    // Show after 4 seconds for dramatic effect
    timerRef.current = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(`spawn_dismissed_${new Date().toDateString()}`, '1');
    setDismissed(true);
  };

  const goExplore = () => {
    dismiss();
    navigate('/explore');
  };

  if (dismissed) return null;

  const spawn = getDailySpawn();
  const style = RARITY_COLORS[spawn.rarity] || RARITY_COLORS.rare;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="fixed top-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-sm"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div
            className={`rounded-2xl border bg-gradient-to-br ${style.bg} ${style.border} p-3 shadow-2xl`}
            style={{ boxShadow: `0 8px 32px -8px ${style.color}60` }}
          >
            <div className="flex items-start gap-3">
              {/* Pulsing icon */}
              <div className="relative shrink-0">
                <div className="text-2xl">{spawn.emoji}</div>
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping"
                  style={{ background: style.color }} />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ background: style.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap size={9} style={{ color: style.color }} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: style.color }}>
                    Treasure Spawn · {spawn.rarity}
                  </span>
                </div>
                <div className="text-white font-bold text-sm">{spawn.mineral}</div>
                <div className="text-white/50 text-[10px] flex items-center gap-1 mt-0.5">
                  <MapPin size={8} />
                  {spawn.hint} · ~{spawn.distance}
                </div>
              </div>

              <button onClick={dismiss} className="shrink-0 text-white/30 hover:text-white/70 transition p-1">
                <X size={14} />
              </button>
            </div>

            <button
              onClick={goExplore}
              className="mt-2 w-full py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] transition-all"
              style={{ background: `${style.color}20`, color: style.color, border: `1px solid ${style.color}40` }}
            >
              GO GO GO → Open Map
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}