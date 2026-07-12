/**
 * FieldRarityBadge — Temporal-Depletion Engine UI
 *
 * Fetches the depletion-adjusted rarity for a mineral in its geologic unit
 * and displays the "Field Rarity" alongside the AI-assessed base rarity.
 * Shows depletion percentage and discovery count so the explorer understands
 * how picked-over this formation is.
 */
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingDown, Layers, Loader2 } from 'lucide-react';

const RARITY_COLORS = {
  common:    { color: '#94a3b8', label: 'Common',    bg: 'hsla(215,20%,55%,0.12)' },
  uncommon:  { color: '#34d399', label: 'Uncommon',  bg: 'hsla(160,70%,50%,0.12)' },
  rare:      { color: '#38bdf8', label: 'Rare',      bg: 'hsla(200,90%,60%,0.12)' },
  legendary: { color: '#a78bfa', label: 'Legendary', bg: 'hsla(270,80%,65%,0.12)' },
};

export default function FieldRarityBadge({ mineralName, lat, lng, baseRarity }) {
  const [depletion, setDepletion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mineralName || lat == null || lng == null) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchDepletion = async () => {
      try {
        const res = await base44.functions.invoke('resolveDepletion', {
          mineral_name: mineralName,
          lat,
          lng,
          apply: false,
          rarity: baseRarity,
        });
        if (!cancelled) setDepletion(res?.data || null);
      } catch {
        // Silent fail — badge is supplementary
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDepletion();
    return () => { cancelled = true; };
  }, [mineralName, lat, lng, baseRarity]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px]"
        style={{ background: 'hsla(270,20%,20%,0.4)', border: '1px solid hsla(270,30%,40%,0.2)' }}>
        <Loader2 size={9} className="animate-spin text-white/30" />
        <span className="text-white/30">Field rarity…</span>
      </div>
    );
  }

  if (!depletion) return null;

  const adj = RARITY_COLORS[depletion.adjusted_rarity] || RARITY_COLORS.common;
  const base = RARITY_COLORS[baseRarity] || RARITY_COLORS.common;
  const shifted = depletion.adjusted_rarity !== baseRarity;
  const depletionPct = Math.round((depletion.depletion_percentage || 0) * 100);

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold"
        style={{ background: adj.bg, border: `1px solid ${adj.color}40` }}
      >
        <Layers size={9} style={{ color: adj.color }} />
        <span style={{ color: adj.color }}>Field: {adj.label}</span>
        {shifted && (
          <span className="flex items-center gap-0.5 text-white/40 ml-0.5">
            <TrendingDown size={8} /> ↓ from {base.label}
          </span>
        )}
      </div>
      {depletion.discovery_count > 0 && (
        <div className="flex items-center gap-2 px-1 text-[8px] text-white/35">
          <span>{depletion.discovery_count} found here</span>
          {depletionPct > 0 && <span>· {depletionPct}% depleted</span>}
          {depletion.geologic_unit && depletion.geologic_unit !== 'Unknown' && (
            <span className="truncate max-w-[120px]">· {depletion.geologic_unit}</span>
          )}
        </div>
      )}
    </div>
  );
}