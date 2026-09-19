import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const OPT_KEY = 'rhgo_weekly_digest_opt_in';

/**
 * Weekly hunt digest — client opt-in + preview. Server sendWeeklySummary
 * still runs on the admin schedule; this captures preference + retention nudge.
 */
export default function WeeklyDigestCard() {
  const [optIn, setOptIn] = useState(() => localStorage.getItem(OPT_KEY) === '1');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.email || !alive) return;
        const specimens = await base44.entities.Specimen.list('-found_date', 12);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = (specimens || []).filter((s) => {
          const t = new Date(s.found_date || s.created_date || 0).getTime();
          return Number.isFinite(t) && t >= weekAgo;
        });
        if (alive) {
          setPreview({
            count: recent.length,
            top: recent[0]?.mineral_name || null,
            name: me.full_name?.split(' ')[0] || 'explorer',
          });
        }
      } catch {
        /* guest */
      }
    })();
    return () => { alive = false; };
  }, []);

  const toggle = () => {
    const next = !optIn;
    setOptIn(next);
    localStorage.setItem(OPT_KEY, next ? '1' : '0');
    try {
      base44.analytics?.track?.({ eventName: next ? 'weekly_digest_opt_in' : 'weekly_digest_opt_out' });
    } catch { /* optional */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-card p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsla(280,70%,40%,0.25)', border: '1px solid hsla(280,80%,60%,0.3)' }}>
          <Mail size={16} className="text-amethyst-glow" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst-glow/80">Weekly hunt digest</div>
          <p className="text-white/55 text-[12px] mt-1 leading-snug">
            {preview?.count
              ? `${preview.name}, you logged ${preview.count} find${preview.count === 1 ? '' : 's'} this week${preview.top ? ` — including ${preview.top}` : ''}.`
              : 'Get a Sunday recap of finds, streak, and nearby hunts Clover picked for you.'}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={toggle}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition active:scale-95"
              style={{
                background: optIn ? 'hsla(160,60%,35%,0.35)' : 'hsla(0,0%,100%,0.06)',
                border: `1px solid ${optIn ? 'hsla(160,70%,50%,0.45)' : 'hsla(0,0%,100%,0.12)'}`,
                color: optIn ? '#9FE8D0' : 'rgba(255,255,255,0.65)',
              }}
            >
              {optIn ? 'On — Sunday email' : 'Turn on'}
            </button>
            <Link to="/explore" className="text-[11px] text-white/40 flex items-center gap-1 hover:text-white/70">
              <Sparkles size={11} /> Preview hunts
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
