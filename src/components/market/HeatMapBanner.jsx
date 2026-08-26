/**
 * HeatMapBanner — Snapchat-style live activity heat map strip for the Market.
 * Shows pulsing dots representing recent listing + catch activity.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RARITY_COLORS = { common: '#94a3b8', uncommon: '#34d399', rare: '#38bdf8', legendary: '#a78bfa' };
const BANNER_HEIGHT = 56;

function hashValue(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed) {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967295;
}

export function createHeatDots(listings, width, height = BANNER_HEIGHT) {
  if (listings.length === 0) {
    return Array.from({ length: 12 }, (_, index) => ({
      x: ((index + 0.5) / 12) * width * 0.9 + width * 0.05,
      y: height / 2 + Math.sin(index * 0.8) * height * 0.3,
      r: 3 + seededUnit(index + 1) * 5,
      color: Object.values(RARITY_COLORS)[index % 4],
    }));
  }

  return listings.map((listing, index) => {
    const seed = hashValue(listing.id || `${listing.mineral_name || 'listing'}-${index}`);
    return {
      x: ((index + 0.5) / listings.length) * width * 0.9 + width * 0.05
        + (seededUnit(seed) - 0.5) * Math.min(30, width * 0.08),
      y: height / 2 + (seededUnit(seed + 1) - 0.5) * height * 0.5,
      r: 3 + seededUnit(seed + 2) * 4,
      color: RARITY_COLORS[listing.rarity] || RARITY_COLORS.common,
    };
  });
}

export function drawHeat(canvas, listings, deviceScale = globalThis.devicePixelRatio || 1) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const width = Math.max(1, Math.round(canvas.clientWidth || 400));
  const scale = Math.min(Math.max(deviceScale, 1), 2);
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(BANNER_HEIGHT * scale);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, BANNER_HEIGHT);

  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'hsla(265,50%,8%,0)');
  gradient.addColorStop(0.5, 'hsla(265,50%,12%,0.4)');
  gradient.addColorStop(1, 'hsla(265,50%,8%,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, BANNER_HEIGHT);

  createHeatDots(listings, width).forEach((dot) => {
    const glow = context.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.r * 3);
    glow.addColorStop(0, `${dot.color}cc`);
    glow.addColorStop(1, `${dot.color}00`);
    context.beginPath();
    context.arc(dot.x, dot.y, dot.r * 3, 0, Math.PI * 2);
    context.fillStyle = glow;
    context.fill();
    context.beginPath();
    context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    context.fillStyle = dot.color;
    context.fill();
  });
}

export default function HeatMapBanner() {
  const canvasRef = useRef(null);
  const [recentCount, setRecentCount] = useState(0);
  const [hotMineral, setHotMineral] = useState('');
  const [listings, setListings] = useState([]);

  useEffect(() => {
    let active = true;
    base44.entities.MarketListing.list('-created_date', 30)
      .then((nextListings) => {
        if (!active) return;
        setListings(nextListings);
        setRecentCount(nextListings.length);
        if (nextListings.length > 0) {
          // Find most common mineral
          const counts = {};
          nextListings.forEach((listing) => {
            counts[listing.mineral_name] = (counts[listing.mineral_name] || 0) + 1;
          });
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          if (top) setHotMineral(top[0]);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const render = () => drawHeat(canvas, listings);
    render();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(render);
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    globalThis.addEventListener?.('resize', render);
    return () => globalThis.removeEventListener?.('resize', render);
  }, [listings]);

  return (
    <div className="rounded-2xl overflow-hidden mb-4 relative"
      style={{ background: 'hsla(265,30%,8%,0.8)', border: '1px solid hsla(270,40%,35%,0.2)' }}>
      <canvas ref={canvasRef} aria-hidden="true" className="block w-full" style={{ height: BANNER_HEIGHT }} />
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full"
          style={{ background: 'hsla(265,40%,6%,0.8)', backdropFilter: 'blur(6px)', border: '1px solid hsla(270,40%,35%,0.2)' }}>
          <Flame size={13} className="text-orange-400" />
          <span className="text-[11px] font-bold text-white/80">Live Trade Activity</span>
          {hotMineral && <span className="text-[10px] text-amethyst-glow/80">· {hotMineral} trending</span>}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'hsla(265,40%,6%,0.8)', backdropFilter: 'blur(6px)', border: '1px solid hsla(270,40%,35%,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
          <span className="text-[10px] text-white/60">{recentCount} listings</span>
        </div>
      </div>
    </div>
  );
}
