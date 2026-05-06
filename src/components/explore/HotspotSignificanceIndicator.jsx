import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, TrendingUp, BookOpen } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { cn } from '@/lib/utils';

/**
 * HotspotSignificanceIndicator
 * 
 * Displays geological significance weighting for a hotspot.
 * Shows: scientific importance, discovery rarity, educational value.
 */
export default function HotspotSignificanceIndicator({ hotspot_id, className = '' }) {
  const [significance, setSignificance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const results = await base44.entities.HotspotSignificance.filter({
          hotspot_id,
        });
        setSignificance(results?.[0] || null);
      } catch (error) {
        console.error('Failed to fetch significance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [hotspot_id]);

  if (loading || !significance) return null;

  const { scientific_importance = 3, discovery_rarity = 3, educational_value = 3 } = significance;
  const avg = Math.round((scientific_importance + discovery_rarity + educational_value) / 3 * 10) / 10;

  const renderStars = (score) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={cn(
              i < Math.round(score) ? 'fill-amethyst-glow text-amethyst-glow' : 'text-white/20'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <GlassPanel className={cn('p-3 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-amethyst/70">
          Significance
        </span>
        <span className="text-sm font-bold text-amethyst-glow">{avg}/5</span>
      </div>

      {/* Scientific Importance */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-[11px] text-white/60">Scientific</span>
        </div>
        {renderStars(scientific_importance)}
      </div>

      {/* Discovery Rarity */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Star size={12} className="text-hud-cyan" />
          <span className="text-[11px] text-white/60">Rarity</span>
        </div>
        {renderStars(discovery_rarity)}
      </div>

      {/* Educational Value */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={12} className="text-amethyst-glow" />
          <span className="text-[11px] text-white/60">Education</span>
        </div>
        {renderStars(educational_value)}
      </div>

      {significance.child_safe && (
        <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400">
          ✓ Family-friendly
        </div>
      )}
    </GlassPanel>
  );
}