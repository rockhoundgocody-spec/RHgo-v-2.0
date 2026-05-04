import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Gem, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import SplitCompareView from '@/components/scan/SplitCompareView.jsx';
import { Button } from '@/components/ui/button';

/**
 * LiveCompare — split-screen comparison between the user's current scan
 * (passed via location.state.scanImageUrl + scanName) and a high-def
 * library specimen image. (Previously /compare-live.)
 */
export default function LiveCompare() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scanImageUrl, scanName } = location.state || {};

  const [minerals, setMinerals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    base44.entities.Mineral.list().then((m) => {
      setMinerals(m || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!scanName || !minerals.length) return;
    const lower = scanName.toLowerCase();
    const exact = minerals.find((m) => m.name?.toLowerCase() === lower);
    const partial =
      exact ||
      minerals.find(
        (m) =>
          lower.includes(m.name?.toLowerCase() || '') ||
          (m.name || '').toLowerCase().includes(lower)
      );
    setSelectedId((partial || minerals[0])?.id || null);
  }, [scanName, minerals]);

  const selected = useMemo(
    () => minerals.find((m) => m.id === selectedId) || null,
    [minerals, selectedId]
  );

  if (!scanImageUrl) {
    return (
      <GlassPanel className="p-10 text-center">
        <Gem className="mx-auto text-amethyst/40 mb-3" size={40} />
        <p className="text-white/70">No active scan to compare.</p>
        <p className="text-white/40 text-xs mt-2">
          Capture a specimen on the Scan page, then tap "Compare" on the result.
        </p>
        <Button
          onClick={() => navigate('/scan')}
          className="mt-4 bg-amethyst-deep hover:bg-amethyst"
        >
          Start a scan
        </Button>
      </GlassPanel>
    );
  }

  return (
    <>
      <HudFrame label="Live · Library · Comparison">
        {loading || !selected ? (
          <div className="aspect-square flex items-center justify-center">
            <Loader2 className="animate-spin text-amethyst/60" />
          </div>
        ) : (
          <SplitCompareView
            leftImageUrl={scanImageUrl}
            rightImageUrl={selected.image_url}
            leftLabel={scanName || 'Your Scan'}
            rightLabel={selected.name}
          />
        )}
      </HudFrame>

      {!loading && minerals.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
            Reference specimen
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {minerals.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider"
                style={{
                  background:
                    m.id === selectedId
                      ? 'hsla(280,80%,40%,0.3)'
                      : 'hsla(220,30%,20%,0.3)',
                  border: `1px solid ${m.id === selectedId ? 'hsl(280 100% 70%)' : 'hsla(220,30%,40%,0.4)'}`,
                  color:
                    m.id === selectedId
                      ? 'hsl(280 100% 85%)'
                      : 'hsla(0,0%,80%,0.7)',
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}