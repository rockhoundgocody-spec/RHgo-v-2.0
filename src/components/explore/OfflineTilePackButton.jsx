/* eslint-disable unused-imports/no-unused-imports */
import React, { useState } from 'react';
import { Download, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import useOfflineTiles from '@/lib/useOfflineTiles';
import { cn } from '@/lib/utils';

/**
 * Small HUD button that lets the user cache map tiles for their current area.
 * Appears in the Explore page when userLocation is known.
 */
export default function OfflineTilePackButton({ userLocation }) {
  const { prefetch, clear, status, progress, tileCount } = useOfflineTiles();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!userLocation) return null;

  const handleDownload = async () => {
    setShowConfirm(false);
    await prefetch({
      lat: userLocation.lat,
      lng: userLocation.lng,
      radiusMiles: 40,
      minZoom: 7,
      maxZoom: 13,
    });
  };

  if (status === 'done') {
    return (
      <button
        onClick={clear}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider border bg-black/40 border-emerald-500/40 text-emerald-400 hover:border-rose-400/50 hover:text-rose-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
        title="Clear cached tiles"
      >
        <CheckCircle2 size={12} />
        Tiles cached · clear
      </button>
    );
  }

  if (status === 'fetching') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider border bg-black/40 border-hud-cyan/30 text-hud-cyan/70">
        <Loader2 size={12} className="animate-spin" />
        {progress}% of {tileCount} tiles
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-white/60">Cache 40-mile tile pack?</span>
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider border bg-hud-cyan/20 border-hud-cyan/60 text-hud hover:bg-hud-cyan/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
        >
          Yes
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider border bg-black/40 border-white/10 text-white/50 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider border bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-hud-cyan/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
      title="Download offline tile pack for this area"
    >
      <Download size={12} />
      Offline tiles
    </button>
  );
}