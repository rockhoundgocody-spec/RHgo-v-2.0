import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Scale, AlertTriangle, CheckCircle } from 'lucide-react';

const LIMIT_LBS = 25;
const WARN_THRESHOLD = 0.8; // warn at 80% of limit
const AVG_SPECIMEN_LBS = 0.5; // rough estimate per collected stone

export default function CollectionWeightTracker({ userEmail }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    const year = new Date().getFullYear();
    base44.entities.CollectionWeight
      .filter({ owner_email: userEmail, year })
      .then((rows) => {
        setRecord(rows[0] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userEmail]);

  if (loading || !record) return null;

  const pct = Math.min((record.total_weight_lbs / LIMIT_LBS) * 100, 100);
  const overLimit = record.total_weight_lbs >= LIMIT_LBS;
  const nearLimit = !overLimit && pct >= WARN_THRESHOLD * 100;

  const color = overLimit ? '#ef4444' : nearLimit ? '#f59e0b' : '#34d399';
  const statusText = overLimit
    ? `⚠️ Annual limit reached (${record.total_weight_lbs.toFixed(1)} / ${LIMIT_LBS} lbs)`
    : nearLimit
    ? `Approaching MI limit — ${(LIMIT_LBS - record.total_weight_lbs).toFixed(1)} lbs remaining`
    : `${record.total_weight_lbs.toFixed(1)} / ${LIMIT_LBS} lbs collected this year`;

  return (
    <div className="rounded-2xl px-4 py-3"
      style={{
        background: overLimit
          ? 'hsla(0,60%,10%,0.85)'
          : nearLimit
          ? 'hsla(38,60%,10%,0.85)'
          : 'hsla(145,50%,8%,0.7)',
        border: `1px solid ${color}40`,
      }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {overLimit ? (
            <AlertTriangle size={13} style={{ color }} />
          ) : nearLimit ? (
            <AlertTriangle size={13} style={{ color }} />
          ) : (
            <Scale size={13} style={{ color }} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color }}>
            MI Annual Limit
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/40">
          {record.specimen_count} specimens · est. {record.total_weight_lbs.toFixed(1)} lbs
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>

      <p className="text-[10px] text-white/45">{statusText}</p>

      {overLimit && (
        <p className="text-[10px] text-red-400/70 mt-1">
          Michigan DNR limit: 25 lbs of rock, mineral, and fossil per person per year on state land.
        </p>
      )}
    </div>
  );
}

/**
 * Utility: log a new collected specimen's estimated weight.
 * Call this after saving a specimen with disposition=collected.
 */
export async function logCollectedWeight(userEmail, weightLbs = AVG_SPECIMEN_LBS) {
  if (!userEmail) return;
  const year = new Date().getFullYear();
  try {
    const existing = await base44.entities.CollectionWeight.filter({ owner_email: userEmail, year });
    if (existing[0]) {
      await base44.entities.CollectionWeight.update(existing[0].id, {
        total_weight_lbs: (existing[0].total_weight_lbs || 0) + weightLbs,
        specimen_count: (existing[0].specimen_count || 0) + 1,
        last_updated: new Date().toISOString(),
      });
    } else {
      await base44.entities.CollectionWeight.create({
        owner_email: userEmail,
        year,
        total_weight_lbs: weightLbs,
        specimen_count: 1,
        state: 'MI',
        limit_lbs: LIMIT_LBS,
        last_updated: new Date().toISOString(),
      });
    }
  } catch {}
}