/**
 * HeatMapBanner — Snapchat-style live activity heat map strip for the Market.
 * Shows pulsing dots representing recent listing + catch activity.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Flame, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RARITY_COLORS = { common: '#94a3b8', uncommon: '#34d399', rare: '#38bdf8', legendary: '#a78bfa' };

export default function HeatMapBanner() {
  const canvasRef = useRef(null);
  const [recentCount, setRecentCount] = useState(0);
  const [hotMineral, setHotMineral] = useState('');

  useEffect(() => {
    // Load recent listings to drive heatmap dots
    base44.entities.MarketListing.list('-created_date', 30)
      .then(listings => {
        setRecentCount(listings.length);
        if (listings.length > 0) {
          // Find most common mineral
          const counts = {};
          listings.forEach(l => { counts[l.mineral_name] = (counts[l.mineral_name] || 0) + 1; });
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          if (top) setHotMineral(top[0]);
        }
        drawHeat(canvasRef.current, listings);
      })
      .catch(() => {});
  }, []);

  function drawHeat(canvas, listings) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'hsla(265,50%,8%,0)');
    grad.addColorStop(0.5, 'hsla(265,50%,12%,0.4)');
    grad.addColorStop(1, 'hsla(265,50%,8%,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw dots based on actual listings or fallback
    const dots = listings.length > 0 ? listings.map((l, i) => ({
      x: (i / listings.length) * W * 0.9 + W * 0.05 + (Math.random() - 0.5) * 30,
      y: H / 2 + (Math.random() - 0.5) * H * 0.5,
      r: 3 + Math.random() * 4,
      color: RARITY_COLORS[l.rarity] || '#94a3b8',
    })) : Array.from({ length: 12 }, (_, i) => ({
      x: (i / 12) * W * 0.9 + W * 0.05,
      y: H / 2 + Math.sin(i * 0.8) * H * 0.3,
      r: 3 + Math.random() * 5,
      color: Object.values(RARITY_COLORS)[i % 4],
    }));

    dots.forEach(d => {
      const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3);
      grd.addColorStop(0, d.color + 'cc');
      grd.addColorStop(1, d.color + '00');
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    });
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-4 relative"
      style={{ background: 'hsla(265,30%,8%,0.8)', border: '1px solid hsla(270,40%,35%,0.2)' }}>
      <canvas ref={canvasRef} width={400} height={56} className="w-full" style={{ height: 56 }} />
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full"
          style={{ background: 'hsla(265,40%,6%,0.8)', backdropFilter: 'blur(6px)', border: '1px solid hsla(270,40%,35%,0.2)' }}>
          <Flame size={13} className="text-orange-400" />
          <span className="text-[11px] font-bold text-white/80">Live Trade Activity</span>
          {hotMineral && <span className="text-[10px] text-amethyst-glow/80">· {hotMineral} trending</span>}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'hsla(265,40%,6%,0.8)', backdropFilter: 'blur(6px)', border: '1px solid hsla(270,40%,35%,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/60">{recentCount} listings</span>
        </div>
      </div>
    </div>
  );
}