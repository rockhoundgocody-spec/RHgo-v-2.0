import React, { useEffect, useRef, useState } from 'react';
import { HardDrive } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { dumpAllCaches } from '@/lib/dumpCache.js';
import SectionHeader from './SectionHeader.jsx';

export default function StorageSection() {
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [cacheDumping, setCacheDumping] = useState(false);
  const [cacheDumped, setCacheDumped] = useState(false);
  const reloadTimer = useRef(null);

  useEffect(() => {
    let active = true;
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      navigator.storage.estimate().then((estimate) => {
        if (active) setStorageEstimate(estimate);
      }).catch(() => {});
    }
    return () => {
      active = false;
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
    };
  }, []);

  const usageMb = storageEstimate ? Math.round((storageEstimate.usage || 0) / 1048576) : null;
  const usagePercent = storageEstimate?.quota
    ? Math.min(100, Math.round(((storageEstimate.usage || 0) / storageEstimate.quota) * 100))
    : 0;

  const handleDumpCache = async () => {
    if (cacheDumping) return;
    setCacheDumping(true);
    try {
      await dumpAllCaches();
      setCacheDumped(true);
      if (typeof window !== 'undefined') {
        reloadTimer.current = window.setTimeout(() => window.location.reload(), 900);
      }
    } finally {
      setCacheDumping(false);
    }
  };

  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader icon={HardDrive} iconColor="text-hud-cyan" title="Storage" />
        <div className="ml-9 space-y-2">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Local cache</span>
            <span className="font-mono">{usageMb === null ? '—' : `${usageMb} MB`}</span>
          </div>
          <div
            className="w-full h-2 rounded-full bg-white/10 overflow-hidden"
            role="progressbar"
            aria-label="Local storage used"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={usagePercent}
          >
            <div
              className="h-full rounded-full transition-[width] motion-reduce:transition-none"
              style={{
                width: `${usagePercent}%`,
                background: 'linear-gradient(90deg, hsl(270,80%,55%), hsl(280,100%,70%))',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleDumpCache}
            disabled={cacheDumping}
            className="text-xs text-amethyst-glow/70 hover:text-amethyst-glow mt-1 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/70 rounded"
          >
            <span aria-live="polite">
              {cacheDumping ? 'Dumping…' : cacheDumped ? '✓ Dumped — reloading' : 'Clear cache'}
            </span>
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
