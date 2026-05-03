import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Play, Pause, Globe } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { Button } from '@/components/ui/button';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * MindatCrawlerPanel — admin control surface for the mindat.org crawler.
 * Runs `crawlMindat` letter-by-letter, paginating with offset, until
 * all letters return zero. Reports progress live.
 */
export default function MindatCrawlerPanel({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState({ letter: '—', offset: 0, total: 0 });
  const stopRef = useRef(false);

  const append = (line) => setLog((l) => [...l.slice(-40), line]);

  const run = async () => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);
    setProgress({ letter: 'A', offset: 0, total: 0 });
    let grandTotal = 0;

    for (const letter of LETTERS) {
      if (stopRef.current) break;
      let offset = 0;
      while (true) {
        if (stopRef.current) break;
        setProgress({ letter, offset, total: grandTotal });
        append(`▸ Crawling ${letter} @ offset ${offset}…`);
        try {
          const res = await base44.functions.invoke('crawlMindat', {
            letter, offset, limit: 25,
          });
          const d = res.data || {};
          if (d.error) {
            append(`✕ ${letter}@${offset}: ${d.error}`);
            break;
          }
          const created = d.created || 0;
          grandTotal += created;
          append(`✓ ${letter}@${offset}: +${created} (errors:${d.errors?.length || 0}, totalFound:${d.totalFound || 0})`);
          // stop letter when nothing left to find at this offset
          if (!d.totalFound || offset + 25 >= d.totalFound) break;
          offset += 25;
        } catch (e) {
          append(`✕ ${letter}@${offset}: ${e.message}`);
          break;
        }
      }
    }
    setRunning(false);
    append(`■ Done. Created ~${grandTotal} minerals total.`);
    onComplete?.();
  };

  const stop = () => { stopRef.current = true; };

  const runOne = async (letter) => {
    setRunning(true);
    setLog([]);
    append(`▸ Single batch: ${letter} @ 0`);
    try {
      const res = await base44.functions.invoke('crawlMindat', {
        letter, offset: 0, limit: 25,
      });
      const d = res.data || {};
      append(d.error
        ? `✕ ${d.error}`
        : `✓ +${d.created || 0} (errors:${d.errors?.length || 0}, totalFound:${d.totalFound || 0})`
      );
    } catch (e) {
      append(`✕ ${e.message}`);
    }
    setRunning(false);
    onComplete?.();
  };

  return (
    <GlassPanel variant="hud" className="mb-6">
      <HudFrame label="Mindat.org Crawler">
        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-white font-medium">
                <Globe size={16} className="text-hud-cyan" />
                Build Mineral Catalog from mindat.org
              </div>
              <div className="text-xs text-hud-cyan/60 mt-1">
                Crawls A–Z, fetches each species page, extracts structured fields via AI,
                and bulk-inserts into the Mineral entity. Skips duplicates by name.
                Polite — paces requests.
              </div>
            </div>
            {running ? (
              <Button onClick={stop} variant="outline" className="border-rose-400/40 text-rose-300">
                <Pause size={14} className="mr-1" /> Stop
              </Button>
            ) : (
              <Button onClick={run} className="bg-hud-cyan/20 hover:bg-hud-cyan/30 border border-hud-cyan/50 text-hud">
                <Play size={14} className="mr-1" /> Crawl All
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {LETTERS.map((L) => (
              <button
                key={L}
                onClick={() => runOne(L)}
                disabled={running}
                className="w-7 h-7 text-xs font-mono rounded border border-hud-cyan/30 text-hud-cyan/80 hover:bg-hud-cyan/15 hover:text-hud disabled:opacity-30 transition"
                title={`Crawl letter ${L} (one batch of 25)`}
              >
                {L}
              </button>
            ))}
          </div>

          {running && (
            <div className="flex items-center gap-2 text-xs text-hud-cyan/80 font-mono">
              <Loader2 size={12} className="animate-spin" />
              Letter {progress.letter} · offset {progress.offset} · running…
            </div>
          )}

          {log.length > 0 && (
            <div className="bg-black/40 rounded border border-hud-cyan/20 p-2 max-h-48 overflow-y-auto font-mono text-[11px] text-hud-cyan/85 leading-relaxed">
              {log.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </div>
      </HudFrame>
    </GlassPanel>
  );
}