import React, { useState, useEffect } from 'react';
import { HardDrive } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { dumpAllCaches } from '@/lib/dumpCache.js';
import SectionHeader from './SectionHeader.jsx';

export default function StorageSection() {
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [cacheDumping, setCacheDumping] = useState(false);
  const [cacheDumped, setCacheDumped] = useState(false);

  const handleDumpCache = async () => {
    if (cacheDumping) return;
    setCacheDumping(true);
    await dumpAllCaches();
    setCacheDumping(false);
    setCacheDumped(true);
    setTimeout(() => {
      setCacheDumped(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 900);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.storage?.estimate) {
      navigator.storage.estimate().then(setStorageEstimate).catch(() => {});
    }
  }, []);

  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader icon={HardDrive} iconColor="text-hud-cyan" title="Storage" />
        <div className="ml-9 space-y-2">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Local cache</span>
            <span className="font-mono">
              {storageEstimate ? `${Math.round((storageEstimate.usage || 0) / 1048576)} MB` : '—'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: storageEstimate?.quota ? `${Math.min(100, Math.round(((storageEstimate.usage || 0) / storageEstimate.quota) * 100))}%` : '0%',
              background: 'linear-gradient(90deg, hsl(270,80%,55%), hsl(280,100%,70%))',
            }} />
          </div>
          <button
            onClick={handleDumpCache}
            disabled={cacheDumping}
            className="text-xs text-amethyst-glow/70 hover:text-amethyst-glow mt-1 transition disabled:opacity-50 font-medium cursor-pointer"
          >
            {cacheDumping ? 'Dumping…' : cacheDumped ? '✓ Dumped — reloading' : 'Clear cache'}
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
