import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const moods = [
  { key: 'great', label: 'Great', emoji: '✨' },
  { key: 'good', label: 'Good', emoji: '🙂' },
  { key: 'okay', label: 'Okay', emoji: '😌' },
  { key: 'tired', label: 'Tired', emoji: '😴' },
  { key: 'low', label: 'Low', emoji: '💜' },
];

/**
 * DailyCheckIn — Finch-style mood + intention card.
 * Hidden when user has already checked in today.
 */
export default function DailyCheckIn({ companion, onCheckedIn }) {
  const [picked, setPicked] = useState(null);
  const [intention, setIntention] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  if (companion?.last_check_in_date === today) return null;

  const submit = async () => {
    if (!picked) return;
    setSubmitting(true);
    try {
      await base44.functions.invoke('dailyCheckIn', {
        mood_label: picked,
        intention: intention.trim() || undefined,
      });
      onCheckedIn?.({ mood_label: picked, intention: intention.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  const name = companion.name || 'Clover 🍀 Cole';

  return (
    <GlassPanel className="mb-10 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70">
          Daily Check-In
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-hud-cyan/40 to-transparent" />
      </div>
      <p className="text-white/85 text-[15px] leading-relaxed mb-4">
        Clover has been thinking of you. <span className="text-amethyst-glow">How are you feeling today?</span>
      </p>

      <div className="flex gap-2 flex-wrap mb-4">
        {moods.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setPicked(m.key)}
            className={`min-h-[44px] px-3.5 py-2 rounded-full border text-sm transition-all ${
              picked === m.key
                ? 'border-amethyst-glow bg-amethyst/20 text-white'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-amethyst/40 hover:text-white'
            }`}
          >
            <span className="mr-1.5">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={intention}
        onChange={(e) => setIntention(e.target.value)}
        placeholder="One small intention for today (optional)…"
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-amethyst/50"
      />

      <button
        type="button"
        onClick={submit}
        disabled={!picked || submitting}
        className="mt-4 w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-amethyst/40 bg-amethyst/15 hover:bg-amethyst/25 disabled:opacity-40 disabled:cursor-not-allowed text-amethyst-glow text-xs uppercase tracking-[0.3em] transition"
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Resting your companion…
          </>
        ) : (
          <>
            <Check size={14} /> Check In
          </>
        )}
      </button>
    </GlassPanel>
  );
}