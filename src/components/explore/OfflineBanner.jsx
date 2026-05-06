import React from 'react';
import { WifiOff } from 'lucide-react';

function formatAge(ts) {
  if (!ts) return 'unknown';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * Shown on Explore when the network fetch failed but we have cached
 * Hotspot data from a previous session.
 */
export default function OfflineBanner({ cachedAt, count }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 flex items-center gap-3"
    >
      <WifiOff size={16} className="text-amber-300 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-amber-200 text-xs font-semibold">
          Offline mode — showing cached hotspots
        </div>
        <div className="text-amber-200/70 text-[11px]">
          {count} sites · last synced {formatAge(cachedAt)}
        </div>
      </div>
    </div>
  );
}