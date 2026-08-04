/**
 * QuickIDStack — 2B.2 Results: Quick ID
 * Candidate card stack with confidence, key field tests, hardness range,
 * streak, cleavage notes. "Run Deep Analysis" (cloud) + "Compare to collection" CTAs.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, GitCompare, ChevronRight, FlaskConical, Gauge } from 'lucide-react';

const RARITY_COLORS = {
  common:    '#94a3b8',
  uncommon:  '#34d399',
  rare:      '#38bdf8',
  legendary: '#a78bfa',
};

function confidenceColor(c) {
  if (c >= 0.85) return '#34d399';
  if (c >= 0.65) return '#38bdf8';
  if (c >= 0.45) return '#fbbf24';
  return '#f87171';
}

export default function QuickIDStack({
  result,
  candidates = [],
  onDeepAnalysis,
  onCompare,
  deepLoading,
  deepDone,
}) {
  const top = result?.top_match || 'Unknown';
  const conf = result?.confidence ?? 0;
  const rarity = result?.rarity || 'common';
  const rc = RARITY_COLORS[rarity] || RARITY_COLORS.common;
  const cc = confidenceColor(conf);

  // Merge top match into candidate list for the card stack
  const allCandidates = [
    {
      name: top,
      confidence: conf,
      features: result?.observed_features?.slice(0, 3).map(f => `${f.feature}: ${f.value}`).join(' · ') || '',
      rationale: result?.reasoning?.slice(0, 120) + (result?.reasoning?.length > 120 ? '…' : '') || '',
      isTop: true,
    },
    ...candidates.filter(c => c.name !== top),
  ];

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-1.5">
        <Gauge size={11} style={{ color: rc }} />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Quick ID · Candidates</span>
      </div>

      {/* Card stack */}
      <div className="space-y-2">
        {allCandidates.map((c, i) => {
          const barColor = confidenceColor(c.confidence || 0);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', damping: 24 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: c.isTop
                  ? `linear-gradient(135deg, hsla(280,60%,25%,0.4), hsla(255,30%,12%,0.6))`
                  : 'hsla(255,30%,12%,0.5)',
                border: `1px solid ${c.isTop ? `${rc}55` : 'hsla(270,20%,25%,0.25)'}`,
                boxShadow: c.isTop ? `0 0 20px ${rc}22` : 'none',
              }}
            >
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  {/* Rank badge */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                    style={{ background: c.isTop ? rc : 'hsla(0,0%,100%,0.1)', color: '#fff' }}>
                    {i + 1}
                  </div>

                  {/* Name + features */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate">{c.name}</span>
                      {c.isTop && (
                        <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: `${rc}33`, color: rc }}>
                          Top Match
                        </span>
                      )}
                    </div>
                    {c.features && (
                      <p className="text-[10px] text-white/45 mt-0.5 line-clamp-1">{c.features}</p>
                    )}
                  </div>

                  {/* Confidence */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-bold" style={{ color: barColor }}>
                      {Math.round((c.confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-2 h-1 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(c.confidence || 0) * 100}%`, background: barColor, boxShadow: `0 0 6px ${barColor}` }} />
                </div>

                {/* Quick field test data for top match */}
                {c.isTop && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {result?.hardness_mohs != null && (
                      <FieldChip label="Hardness" value={`${result.hardness_mohs} Mohs`} />
                    )}
                    {result?.verification_tests?.[0] && (
                      <FieldChip label="Streak Test" value={result.verification_tests[0].expected} />
                    )}
                    {result?.crystal_system && (
                      <FieldChip label="Cleavage" value={result.crystal_system} />
                    )}
                  </div>
                )}

                {/* Rationale */}
                {c.rationale && (
                  <p className="mt-2 text-[10px] text-white/40 leading-relaxed line-clamp-2">{c.rationale}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action CTAs */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onDeepAnalysis}
          disabled={deepLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            background: deepDone
              ? 'hsla(145,60%,30%,0.3)'
              : 'linear-gradient(135deg, hsla(195,80%,40%,0.4), hsla(215,70%,35%,0.3))',
            border: `1px solid ${deepDone ? 'hsla(145,70%,55%,0.4)' : 'hsla(195,80%,60%,0.35)'}`,
            color: deepDone ? 'hsl(145,80%,70%)' : 'hsl(195,100%,80%)',
            boxShadow: deepDone ? 'none' : '0 0 16px hsla(195,80%,50%,0.15)',
          }}
        >
          <Cloud size={13} />
          {deepLoading ? 'Analyzing…' : deepDone ? 'Deep Analysis Done ✓' : 'Run Deep Analysis'}
        </button>

        {onCompare && (
          <button
            onClick={onCompare}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
            style={{
              background: 'hsla(255,30%,12%,0.6)',
              border: '1px solid hsla(270,20%,30%,0.3)',
              color: 'hsla(0,0%,100%,0.6)',
            }}
          >
            <GitCompare size={13} />
            Compare
          </button>
        )}
      </div>

      {/* Field tests quick link */}
      {result?.verification_tests?.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
          style={{ background: 'hsla(255,30%,10%,0.4)', border: '1px solid hsla(270,15%,20%,0.2)' }}>
          <FlaskConical size={11} className="text-amber-300 shrink-0" />
          <span className="text-[10px] text-white/45">
            {result.verification_tests.length} field tests available — see Tests tab
          </span>
          <ChevronRight size={11} className="text-white/25 ml-auto" />
        </div>
      )}
    </div>
  );
}

function FieldChip({ label, value }) {
  return (
    <div className="px-2 py-1 rounded-md"
      style={{ background: 'hsla(255,30%,10%,0.6)', border: '1px solid hsla(270,15%,25%,0.2)' }}>
      <span className="text-[8px] uppercase tracking-wider text-white/30">{label}: </span>
      <span className="text-[9px] font-semibold text-white/70">{value}</span>
    </div>
  );
}