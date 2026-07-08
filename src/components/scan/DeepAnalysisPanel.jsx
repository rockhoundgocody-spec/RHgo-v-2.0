/**
 * DeepAnalysisPanel — 2B.3 Results: Deep Analysis + Valuation
 * Final ID, locality plausibility, lookalikes ruled out, "why it thinks this",
 * value estimate with comps + market trend, and curated education links.
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  Microscope, MapPin, Shield, TrendingUp, GraduationCap,
  ExternalLink, DollarSign, Loader2, ChevronRight,
} from 'lucide-react';

const TREND_CFG = {
  rising:  { color: '#34d399', label: 'Rising' },
  stable:  { color: '#38bdf8', label: 'Stable' },
  falling: { color: '#f87171', label: 'Falling' },
};

export default function DeepAnalysisPanel({ analysis, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 size={28} className="animate-spin text-hud-cyan" />
        <p className="text-white/50 text-xs uppercase tracking-[0.2em]">Running Deep Analysis…</p>
        <p className="text-white/30 text-[10px]">Cross-referencing locality, lookalikes & valuation</p>
      </div>
    );
  }

  if (!analysis) return null;

  const a = analysis;
  const trend = TREND_CFG[a?.valuation?.market_trend] || TREND_CFG.stable;
  const locScore = a?.locality_plausibility ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* ── Final ID ── */}
      <Section icon={Microscope} label="Final Identification" color="#a78bfa">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white">{a.final_id || 'Unknown'}</div>
            <div className="text-[10px] text-white/40 mt-0.5">
              Confidence: {Math.round((a.confidence || 0) * 100)}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(hsl(280,80%,65%) ${(a.confidence || 0) * 360}deg, hsla(0,0%,100%,0.08) 0deg)`,
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'hsla(255,30%,10%,0.95)', color: 'hsl(280,100%,85%)' }}>
              {Math.round((a.confidence || 0) * 100)}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Why it thinks this ── */}
      {a.reasoning && (
        <Section icon={ChevronRight} label="Why It Thinks This" color="#38bdf8">
          <p className="text-white/70 text-xs leading-relaxed">{a.reasoning}</p>
        </Section>
      )}

      {/* ── Locality plausibility ── */}
      <Section icon={MapPin} label="Locality Plausibility" color="#34d399">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${locScore * 100}%`,
                background: locScore > 0.6 ? '#34d399' : locScore > 0.3 ? '#fbbf24' : '#f87171',
              }} />
          </div>
          <span className="text-xs font-mono font-bold"
            style={{ color: locScore > 0.6 ? '#34d399' : locScore > 0.3 ? '#fbbf24' : '#f87171' }}>
            {Math.round(locScore * 100)}%
          </span>
        </div>
        {a.locality_explanation && (
          <p className="text-white/50 text-[11px] leading-relaxed mt-2">{a.locality_explanation}</p>
        )}
      </Section>

      {/* ── Lookalikes ruled out ── */}
      {a.lookalikes_ruled_out?.length > 0 && (
        <Section icon={Shield} label="Lookalikes Ruled Out" color="#fbbf24">
          <div className="space-y-1.5">
            {a.lookalikes_ruled_out.map((l, i) => (
              <div key={i} className="flex items-start gap-2 px-2.5 py-2 rounded-lg"
                style={{ background: 'hsla(255,30%,10%,0.5)', border: '1px solid hsla(270,15%,20%,0.2)' }}>
                <span className="text-amber-400 text-[10px] font-bold mt-0.5">✗</span>
                <div>
                  <span className="text-white/80 text-xs font-semibold">{l.name}</span>
                  <p className="text-white/40 text-[10px] mt-0.5">{l.why_eliminated}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Valuation + market trend ── */}
      {a.valuation && (
        <Section icon={DollarSign} label="Valuation & Market" color="#f0abfc">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-white">{a.valuation.estimate || 'N/A'}</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: `${trend.color}22`, border: `1px solid ${trend.color}44` }}>
              <TrendingUp size={10} style={{ color: trend.color }} />
              <span className="text-[10px] font-bold" style={{ color: trend.color }}>{trend.label}</span>
            </div>
          </div>
          {a.valuation.trend_explanation && (
            <p className="text-white/45 text-[10px] mb-2">{a.valuation.trend_explanation}</p>
          )}
          {a.valuation.comps?.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-white/30">Comparable Sales</span>
              {a.valuation.comps.map((comp, i) => (
                <div key={i} className="text-[10px] text-white/50 flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  {comp}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Education links ── */}
      {a.education_links?.length > 0 && (
        <Section icon={GraduationCap} label="Learn More" color="#67e8f9">
          <div className="space-y-1.5">
            {a.education_links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all hover:bg-white/5"
                style={{ background: 'hsla(195,60%,10%,0.4)', border: '1px solid hsla(195,60%,40%,0.2)' }}
              >
                <ExternalLink size={11} className="text-cyan-300 shrink-0" />
                <span className="text-cyan-200 text-xs font-medium flex-1 truncate">{link.title}</span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </motion.div>
  );
}

function Section({ icon: Icon, label, color, children }) {
  return (
    <div className="rounded-xl p-3.5"
      style={{
        background: 'hsla(255,30%,10%,0.6)',
        border: `1px solid ${color}22`,
      }}>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon size={11} style={{ color }} />
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}