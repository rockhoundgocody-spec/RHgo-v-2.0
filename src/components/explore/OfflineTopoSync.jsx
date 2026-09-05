/**
 * OfflineTopoSync — extends the offline tile system with topo/terrain tiles.
 * Lets users cache hybrid satellite+topo tiles for their current area,
 * with a progress bar and cache size display.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Download, CheckCircle2, Loader2, Mountain, WifiOff, Trash2, HardDrive } from 'lucide-react';
import useOfflineTiles from '@/lib/useOfflineTiles';

const CACHE_NAME = 'rh-tiles-v1';

export default function OfflineTopoSync({ userLocation }) {
  const { prefetch, clear, status, progress, tileCount } = useOfflineTiles();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cacheSize, setCacheSize] = useState(null);

  const checkCacheSize = useCallback(async () => {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      setCacheSize(keys.length);
    } catch {}
  }, []);

  useEffect(() => { checkCacheSize(); }, [checkCacheSize, status]);

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

  const handleClear = async () => {
    await clear();
    setCacheSize(0);
  };

  return (
    <div className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, hsla(195,60%,15%,0.4) 0%, hsla(220,50%,10%,0.5) 100%)',
        border: '1px solid hsla(195,80%,50%,0.25)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'hsla(195,80%,40%,0.2)', border: '1px solid hsla(195,80%,55%,0.3)' }}>
          <Mountain size={15} className="text-hud-cyan" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Offline Topo Sync</h3>
          <p className="text-white/40 text-[10px]">Cache satellite + terrain tiles for field use</p>
        </div>
      </div>

      {/* Cache status */}
      {cacheSize !== null && cacheSize > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'hsla(150,40%,12%,0.4)', border: '1px solid hsla(150,50%,40%,0.2)' }}>
          <HardDrive size={11} className="text-emerald-400" />
          <span className="text-emerald-400/80 text-[10px] font-mono">{cacheSize} tiles cached</span>
          <button
            onClick={handleClear}
            aria-label="Clear cached tiles"
            className="ml-auto text-white/30 hover:text-rose-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-sm"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Status display */}
      {status === 'fetching' && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Loader2 size={12} className="text-hud-cyan animate-spin" />
            <span className="text-hud-cyan text-[11px] font-mono">{progress}% · {tileCount} tiles</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(255,30%,20%,0.6)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(195,100%,60%), hsl(215,90%,70%))' }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'hsla(150,40%,12%,0.4)', border: '1px solid hsla(150,50%,40%,0.2)' }}>
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span className="text-emerald-400/80 text-[11px]">Tiles cached — map works offline</span>
        </div>
      )}

      {/* Action */}
      {status !== 'fetching' && (
        <>
          {showConfirm ? (
            <div className="space-y-2">
              <p className="text-white/50 text-[11px] text-center">
                Cache a 40-mile tile pack around your location? (~{Math.round(40 * 40 * 0.3)} tiles)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
                  style={{ background: 'linear-gradient(135deg, hsl(195,80%,45%), hsl(215,80%,50%))' }}
                >
                  <Download size={12} className="inline mr-1.5" /> Download
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
                  style={{ background: 'hsla(255,20%,16%,0.5)', border: '1px solid hsla(255,20%,30%,0.2)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
              style={{ background: 'linear-gradient(135deg, hsl(195,80%,45%), hsl(215,80%,50%))', boxShadow: '0 4px 12px hsla(195,80%,50%,0.2)' }}
            >
              <WifiOff size={12} className="inline mr-1.5" /> Cache Offline Tiles
            </button>
          )}
        </>
      )}
    </div>
  );
}