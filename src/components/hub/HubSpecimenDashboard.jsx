import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Radar, ScanLine, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { readGuestSpecimens } from '@/lib/useEntityQuery';
import HubSpecimenRow from '@/components/hub/HubSpecimenRow.jsx';

const RARITIES = ['all', 'common', 'uncommon', 'rare', 'legendary'];
const PAGE_SIZE = 8;

export default function HubSpecimenDashboard({ user }) {
  const [open, setOpen] = useState(true);
  const [rarity, setRarity] = useState('all');
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState({ all: 0, common: 0, uncommon: 0, rare: 0, legendary: 0 });
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    if (user?.email) {
      try {
        const agg = await base44.entities.Specimen.aggregate({ groupBy: 'rarity' });
        const nextCounts = { all: 0, common: 0, uncommon: 0, rare: 0, legendary: 0 };
        for (const row of agg?.rows || []) {
          const key = String(row.rarity || 'common').toLowerCase();
          const c = Number(row.count) || 0;
          if (nextCounts[key] != null) nextCounts[key] += c;
          nextCounts.all += c;
        }
        setCounts(nextCounts);
        return;
      } catch {
        /* fallback to guest/client below */
      }
    }
    const guest = readGuestSpecimens();
    const nextCounts = { all: guest.length, common: 0, uncommon: 0, rare: 0, legendary: 0 };
    for (const s of guest) {
      const k = String(s.rarity || 'common').toLowerCase();
      if (nextCounts[k] != null) nextCounts[k] += 1;
    }
    setCounts(nextCounts);
  }, [user?.email]);

  const loadPage = useCallback(async (cursor = null, append = false) => {
    setLoading(true);
    try {
      if (user?.email) {
        const query = rarity === 'all' ? {} : { rarity };
        const page = await base44.entities.Specimen.filter(query, {
          sort: '-found_date',
          limit: PAGE_SIZE,
          ...(cursor ? { cursor } : {}),
        });
        const list = Array.isArray(page) ? page : (page?.items || []);
        setItems((prev) => (append ? [...prev, ...list] : list));
        setNextCursor(page?.next_cursor || null);
        setHasMore(Boolean(page?.has_more));
      } else {
        const guest = readGuestSpecimens();
        const filtered = rarity === 'all'
          ? guest
          : guest.filter((s) => String(s.rarity || 'common').toLowerCase() === rarity);
        setItems(filtered);
        setNextCursor(null);
        setHasMore(false);
      }
    } catch {
      const guest = readGuestSpecimens();
      setItems(guest);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user?.email, rarity]);

  useEffect(() => {
    loadSummary();
    loadPage(null, false);
    const unsubscribe = base44.entities.Specimen.subscribe(() => {
      loadSummary();
      loadPage(null, false);
    });
    return () => unsubscribe?.();
  }, [loadSummary, loadPage]);

  return (
    <section
      aria-label="Field Intelligence Specimen Dashboard"
      className="relative w-full max-w-[336px] rounded-2xl hud-panel hud-grid-bg p-3.5 text-foreground"
    >
      {/* Corner HUD brackets */}
      <span className="pointer-events-none absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-hud-cyan/70 rounded-tl-[4px]" />
      <span className="pointer-events-none absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-hud-cyan/70 rounded-tr-[4px]" />
      <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-hud-cyan/70 rounded-bl-[4px]" />
      <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-hud-cyan/70 rounded-br-[4px]" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-hud-cyan/15 border border-hud-cyan/40 flex items-center justify-center text-hud shrink-0">
            <Radar size={14} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-hud glow-hud truncate">
              Field Intel · Specimens
            </h2>
            <p className="text-[10px] font-mono text-hud-blue/75">
              {counts.all} logged · {counts.rare + counts.legendary} high-grade
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Collapse specimen dashboard' : 'Expand specimen dashboard'}
          className="px-2 py-1 rounded-lg border border-hud-cyan/30 bg-hud-cyan/10 text-[10px] font-mono uppercase tracking-wider text-hud flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
        >
          <span>{open ? 'Hide' : 'Intel'}</span>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2.5">
          {/* Rarity telemetry filter pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5" role="group" aria-label="Filter by rarity">
            {RARITIES.map((r) => {
              const active = rarity === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarity(r)}
                  aria-pressed={active}
                  className={`shrink-0 px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wider border transition ${
                    active
                      ? 'border-hud-cyan bg-hud-cyan/20 text-hud glow-hud font-bold'
                      : 'border-hud-cyan/20 bg-background/50 text-hud-blue/70 hover:text-hud'
                  }`}
                >
                  {r} ({counts[r] ?? 0})
                </button>
              );
            })}
          </div>

          {/* Specimen list */}
          {loading && items.length === 0 ? (
            <div className="py-5 text-center text-xs font-mono text-hud-blue/70">
              Scanning specimen ledger…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-hud-cyan/20 bg-background/50 p-3.5 text-center space-y-2">
              <Layers size={18} className="mx-auto text-hud-cyan/70" />
              <p className="text-xs text-foreground/80">
                No {rarity !== 'all' ? rarity : ''} specimens logged in telemetry yet.
              </p>
              <Link
                to="/scan"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hud-cyan/50 bg-hud-cyan/15 text-[10px] font-mono font-bold uppercase tracking-wider text-hud"
              >
                <ScanLine size={12} />
                Scan Specimen
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
              {items.map((specimen) => (
                <HubSpecimenRow key={specimen.id} specimen={specimen} />
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => loadPage(nextCursor, true)}
                  disabled={loading}
                  className="w-full py-1.5 rounded-lg border border-hud-cyan/30 bg-hud-cyan/10 text-[10px] font-mono font-bold uppercase tracking-wider text-hud hover:bg-hud-cyan/20 transition"
                >
                  {loading ? 'Loading…' : 'Load More Telemetry'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}