import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompare, RotateCcw, Sparkles, ChevronLeft } from 'lucide-react';

const RARITY_CFG = {
  common:    { label: 'Common',    color: '#94a3b8', glow: 'hsla(215,20%,55%,0.4)' },
  uncommon:  { label: 'Uncommon',  color: '#34d399', glow: 'hsla(160,70%,50%,0.45)' },
  rare:      { label: 'Rare',      color: '#38bdf8', glow: 'hsla(200,90%,60%,0.5)' },
  legendary: { label: 'Legendary', color: '#a78bfa', glow: 'hsla(270,80%,65%,0.6)' },
};

/**
 * Compare — shows the just-scanned specimen side-by-side with its AI
 * candidates and lookalikes so the user can visually distinguish them.
 *
 * Receives { result, primaryImageUrl } via router state from the Scan page.
 */
export default function Compare() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, primaryImageUrl } = location.state || {};
  const [selectedIdx, setSelectedIdx] = useState(0);

  const candidates = useMemo(() => result?.candidates || [], [result]);
  const lookalikes = useMemo(() => result?.lookalikes || [], [result]);

  // Build comparison rows: the primary match + candidates + lookalikes
  const compareRows = useMemo(() => {
    const rows = [];
    if (result?.top_match) {
      rows.push({
        name: result.top_match,
        confidence: result.confidence,
        features: result.observed_features || [],
        differentiator: 'Your scan result',
        isPrimary: true,
      });
    }
    for (const c of candidates) {
      rows.push({
        name: c.name,
        confidence: c.confidence,
        features: [],
        differentiator: c.rationale || c.features || '',
        isPrimary: false,
      });
    }
    for (const l of lookalikes) {
      rows.push({
        name: l.name,
        confidence: null,
        features: [],
        differentiator: l.differentiator || '',
        isPrimary: false,
        isLookalike: true,
      });
    }
    return rows;
  }, [result, candidates, lookalikes]);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <GitCompare size={48} className="text-amethyst-glow/40" />
        <p className="text-white/50 text-sm font-semibold">No specimen to compare</p>
        <p className="text-white/30 text-xs">Scan a rock first, then tap Compare.</p>
        <button
          onClick={() => navigate('/scan')}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, hsl(265,70%,48%), hsl(280,90%,60%))' }}
        >
          Go to Scanner
        </button>
      </div>
    );
  }

  const rarity = RARITY_CFG[result.rarity] || RARITY_CFG.common;
  const selected = compareRows[selectedIdx] || compareRows[0];

  return (
    <div className="min-h-screen pb-28" style={{ background: 'hsl(240 20% 4%)' }}>
      {/* Back nav */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'hsla(240,20%,4%,0.85)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-amethyst-glow hover:text-white transition"
          aria-label="Go back">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-black text-white tracking-tight">Compare</h1>
        </div>
        <button onClick={() => navigate('/scan')}
          className="flex items-center gap-1 text-white/50 hover:text-white transition text-xs">
          <RotateCcw size={14} /> Scan
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-2 space-y-4">
        {/* Primary specimen image */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden"
          style={{ border: `1px solid ${rarity.color}40`, boxShadow: `0 0 40px -10px ${rarity.glow}` }}
        >
          <div className="aspect-[4/3] w-full">
            {primaryImageUrl ? (
              <img src={primaryImageUrl} alt={result.top_match} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/60">
                <Sparkles size={40} style={{ color: rarity.color, opacity: 0.4 }} />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 inset-x-0 p-4 pt-10"
            style={{ background: 'linear-gradient(0deg, hsla(240,40%,4%,0.98) 0%, transparent 100%)' }}>
            <div className="text-xl font-black text-white">{result.top_match}</div>
            <div className="text-xs text-amethyst-glow/80 font-mono mt-0.5">
              {result.scientific_name || result.top_match}
            </div>
          </div>
        </motion.div>

        {/* Candidate selector chips */}
        {compareRows.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {compareRows.map((row, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap"
                style={
                  i === selectedIdx
                    ? { background: 'hsla(280,80%,40%,0.3)', border: '1px solid hsla(280,80%,65%,0.5)', color: 'hsl(280,100%,88%)' }
                    : { background: 'hsla(255,30%,12%,0.5)', border: '1px solid hsla(255,30%,30%,0.2)', color: 'hsla(0,0%,100%,0.5)' }
                }
              >
                {row.isPrimary && '★ '}{row.name}
              </button>
            ))}
          </div>
        )}

        {/* Side-by-side comparison card */}
        {selected && (
          <motion.div
            key={selectedIdx}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'hsla(240,25%,7%,0.75)', border: '1px solid hsla(270,25%,25%,0.3)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-white">{selected.name}</div>
                {selected.isPrimary && (
                  <div className="text-[9px] uppercase tracking-wider text-amethyst-glow/70 mt-0.5">Your scan result</div>
                )}
                {selected.isLookalike && (
                  <div className="text-[9px] uppercase tracking-wider text-amber-400/70 mt-0.5">Lookalike — could be confused</div>
                )}
              </div>
              {typeof selected.confidence === 'number' && (
                <div className="text-right">
                  <div className="text-lg font-black tabular-nums" style={{ color: rarity.color }}>
                    {(selected.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-white/30">confidence</div>
                </div>
              )}
            </div>

            {selected.differentiator && (
              <div className="px-3 py-2.5 rounded-xl"
                style={{ background: 'hsla(240,25%,11%,0.6)', border: '1px solid hsla(0,0%,100%,0.08)' }}>
                <div className="text-[9px] uppercase tracking-wider text-white/35 mb-1 font-semibold">
                  {selected.isLookalike ? 'Decisive test' : 'Key features / rationale'}
                </div>
                <p className="text-white/70 text-xs leading-relaxed">{selected.differentiator}</p>
              </div>
            )}

            {selected.features.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selected.features.map((f, i) => (
                  <div key={i} className="px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'hsla(240,25%,11%,0.5)', border: '1px solid hsla(270,20%,25%,0.2)' }}>
                    <div className="text-[8px] uppercase tracking-wider text-white/35 font-mono">{f.feature}</div>
                    <div className="text-[11px] font-bold text-white/90">{f.value}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Side-by-side grid for quick visual comparison */}
        {compareRows.length > 1 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2 font-semibold">
              All Candidates
            </div>
            <div className="space-y-2">
              {compareRows.map((row, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left"
                  style={
                    i === selectedIdx
                      ? { background: 'hsla(280,80%,40%,0.15)', border: '1px solid hsla(280,80%,65%,0.4)' }
                      : { background: 'hsla(240,25%,11%,0.5)', border: '1px solid hsla(255,30%,30%,0.15)' }
                  }
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: row.isPrimary ? rarity.glow : 'hsla(255,30%,16%,0.6)' }}>
                    {row.isPrimary ? '★' : '🔍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{row.name}</div>
                    <div className="text-[10px] text-white/40 truncate">{row.differentiator}</div>
                  </div>
                  {typeof row.confidence === 'number' && (
                    <div className="text-xs font-black tabular-nums flex-shrink-0" style={{ color: rarity.color }}>
                      {(row.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}