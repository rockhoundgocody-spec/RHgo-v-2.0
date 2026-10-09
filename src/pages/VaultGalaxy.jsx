/**
 * VaultGalaxy — the hunter's collection as a living 3D star map.
 *
 * Every find is a star colored by mineral class, orbiting its species; every
 * locality rides the outer belt. Tap a star to fly to it. Search (or say
 * "Hey Clover, pull Sweetwater barite") to light up and fly to a record.
 * When Clover answers from the vault, the galaxy flies to her source.
 *
 * Deep links: /vault?q=<search>  ·  /vault?focus=<entity id>
 * No WebGL, or prefer text? The list view shows the same vault, grouped.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, List, Search, X, Maximize2, Sparkles, Gem, MapPin, NotebookPen, Route, Scan } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useEntityList } from '@/lib/useEntityQuery';
import { buildGalaxy, sampleGalaxy, searchGalaxy, MINERAL_GROUPS } from '@/lib/vaultGraph';
import { lazyPart } from '@/lib/lazyPart';
import { on, emit } from '@/lib/cloverWake';
import useReducedMotion from '@/lib/useReducedMotion';
import PrivateLogPhoto from '@/components/photos/PrivateLogPhoto.jsx';

let webglChecked = null;
function hasWebGL() {
  if (webglChecked != null) return webglChecked;
  try {
    const c = document.createElement('canvas');
    webglChecked = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    webglChecked = false;
  }
  return webglChecked;
}

function GalaxyLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/50 text-xs">
        <Orbit className="animate-spin" style={{ animationDuration: '3s' }} size={28} />
        Charting your galaxy…
      </div>
    </div>
  );
}

const GalaxyCanvas = lazyPart(() => import('@/components/vault/GalaxyCanvas.jsx'), GalaxyLoading);

const KIND_ICON = { find: Gem, log: NotebookPen, trip: Route, site: MapPin, species: Sparkles };
const KIND_LABEL = { find: 'Find', log: 'Field note', trip: 'Expedition', site: 'Locality', species: 'Species' };
const GROUP_LABEL = Object.fromEntries(MINERAL_GROUPS.map((g) => [g.id, g.label]));

export default function VaultGalaxy() {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [params, setParams] = useSearchParams();

  const { data: specimens = [], isLoading: loadingFinds } = useEntityList('Specimen', '-found_date', 500);
  const { data: logs = [] } = useQuery({
    queryKey: ['vault-logs', user?.email],
    queryFn: () => base44.entities.PrivateRockLog.filter({ owner_email: user.email }, '-created_date', 200),
    enabled: !!user?.email,
    initialData: [],
  });
  const { data: capsules = [] } = useQuery({
    queryKey: ['vault-capsules', user?.email],
    queryFn: () => base44.entities.MemoryCapsule.filter({ owner_email: user.email }, '-created_date', 60),
    enabled: !!user?.email,
    initialData: [],
  });

  const isSample = !loadingFinds && specimens.length === 0 && logs.length === 0;
  const graph = useMemo(
    () => (isSample ? sampleGalaxy() : buildGalaxy({ specimens, logs, capsules })),
    [isSample, specimens, logs, capsules],
  );

  const [view, setView] = useState(() => (hasWebGL() ? 'galaxy' : 'list'));
  const [query, setQuery] = useState(() => params.get('q') || '');
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [frameRequest, setFrameRequest] = useState(0);

  const matches = useMemo(() => searchGalaxy(graph.nodes, query), [graph, query]);
  const matchIds = useMemo(() => (query.trim() ? matches.map((n) => n.id) : null), [matches, query]);
  const selected = selectedId ? graph.nodes.find((n) => n.id === selectedId) : null;

  const focusNode = useCallback((nodeId) => {
    if (!nodeId) return;
    setSelectedId(nodeId);
    setFocusRequest({ id: nodeId, at: Date.now() });
  }, []);

  // Deep links: ?focus=<entity id> and ?q=<search> (from Clover voice pulls).
  useEffect(() => {
    if (loadingFinds) return;
    const focus = params.get('focus');
    const q = params.get('q');
    if (focus && graph.byRef.has(focus)) focusNode(graph.byRef.get(focus));
    else if (q) {
      setQuery(q);
      const best = searchGalaxy(graph.nodes, q)[0];
      if (best) focusNode(best.id);
    }
  }, [params, graph, loadingFinds, focusNode]);

  // Clover answered from a vault record → fly there.
  useEffect(() => on('vault:focus', (focus) => {
    const nodeId = focus?.id && graph.byRef.get(focus.id);
    if (nodeId) focusNode(nodeId);
  }), [graph, focusNode]);

  const submitSearch = (e) => {
    e.preventDefault();
    const best = matches[0];
    if (best) focusNode(best.id);
    setParams(query.trim() ? { q: query.trim() } : {}, { replace: true });
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedId(null);
    setParams({}, { replace: true });
    setFrameRequest((n) => n + 1);
  };

  const askClover = (node) => {
    const where = node.place ? ` from ${node.place}` : '';
    emit('clover:ask', node.kind === 'site'
      ? `What have I found at ${node.label}?`
      : node.kind === 'species'
        ? `Tell me about my ${node.label} finds.`
        : `Tell me about my ${node.label}${where}.`);
  };

  const groupsPresent = graph.groups;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100dvh - 80px)', minHeight: 480, background: 'radial-gradient(ellipse at 50% 40%, hsl(262 45% 9%) 0%, hsl(248 50% 4%) 60%, #05040c 100%)' }}>
      <h1 className="sr-only">Vault Galaxy</h1>

      {view === 'galaxy' && graph.nodes.length > 0 && (
        <GalaxyCanvas
          graph={graph}
          matchIds={matchIds}
          selectedId={selectedId}
          hoverId={hoverId}
          focusRequest={focusRequest}
          frameRequest={frameRequest}
          reducedMotion={reducedMotion}
          onSelect={(id) => (id ? focusNode(id) : setSelectedId(null))}
          onHover={setHoverId}
          onError={() => setView('list')}
        />
      )}

      {/* ── HUD: title, search, view toggle ── */}
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-white font-black text-lg tracking-tight leading-none flex items-center gap-2">
                <Orbit size={18} className="text-amethyst-glow" /> Vault Galaxy
              </div>
              <div className="text-white/55 text-[10px] uppercase tracking-[0.22em] mt-1">
                {isSample
                  ? 'Sample vault · your finds will replace it'
                  : `${graph.stats.finds} finds · ${graph.stats.species} species · ${graph.stats.sites} places`}
              </div>
            </div>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsla(250,35%,10%,0.75)', border: '1px solid hsla(270,40%,40%,0.25)' }} role="group" aria-label="Vault view">
              <button type="button" onClick={() => setView('galaxy')} disabled={!hasWebGL()} aria-pressed={view === 'galaxy'}
                aria-label="Galaxy view" className={`p-2 rounded-lg transition disabled:opacity-30 ${view === 'galaxy' ? 'bg-amethyst/30 text-white' : 'text-white/55'}`}>
                <Orbit size={15} />
              </button>
              <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} aria-label="List view"
                className={`p-2 rounded-lg transition ${view === 'list' ? 'bg-amethyst/30 text-white' : 'text-white/55'}`}>
                <List size={15} />
              </button>
              {view === 'galaxy' && (
                <button type="button" onClick={() => { setSelectedId(null); setFrameRequest((n) => n + 1); }} aria-label="Show whole galaxy"
                  className="p-2 rounded-lg text-white/55 hover:text-white transition">
                  <Maximize2 size={15} />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={submitSearch} role="search" className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'hsla(250,35%,10%,0.8)', border: '1px solid hsla(270,40%,45%,0.3)', backdropFilter: 'blur(12px)' }}>
            <Search size={14} className="text-white/45 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search — "agate", "Sweetwater", "native"'
              aria-label="Search your vault"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/35 outline-none"
            />
            {query && (
              <button type="button" onClick={clearSearch} aria-label="Clear search" className="text-white/45 hover:text-white">
                <X size={14} />
              </button>
            )}
          </form>
          {query.trim() && (
            <div className="mt-1.5 text-[10px] text-white/55 px-1" aria-live="polite">
              {matches.length ? `${matches.length} match${matches.length === 1 ? '' : 'es'} — tap Enter to fly to the best one` : 'Nothing in the vault matches that.'}
            </div>
          )}

          {view === 'galaxy' && groupsPresent.length > 0 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }} aria-label="Mineral classes">
              {groupsPresent.map((g) => (
                <button key={g.id} type="button"
                  onClick={() => { setQuery(g.label); setParams({ q: g.label }, { replace: true }); }}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/80"
                  style={{ background: 'hsla(250,35%,10%,0.75)', border: `1px solid ${g.color}55` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
                  {g.label} <span className="text-white/45">{g.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === 'list' && <VaultList graph={graph} matches={matchIds ? matches : null} onSelect={(id) => setSelectedId(id)} />}

      {isSample && (
        <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center pointer-events-none">
          <Link to="/scan" className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold"
            style={{ background: '#9FE8D0', color: '#0a0a14', boxShadow: '0 6px 28px -6px rgba(159,232,208,0.5)' }}>
            <Scan size={15} /> Scan your first find
          </Link>
        </div>
      )}

      {/* ── Selected star ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-0 bottom-4 z-20 px-4"
          >
            <StarCard node={selected} isSample={isSample} onClose={() => setSelectedId(null)} onAsk={askClover} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StarCard({ node, isSample, onClose, onAsk }) {
  const Icon = KIND_ICON[node.kind] || Gem;
  const meta = [
    node.kind === 'species' || node.kind === 'site' ? `${node.count} ${node.count === 1 ? 'record' : 'records'}` : null,
    node.rarity && node.kind !== 'site' && node.kind !== 'species' ? node.rarity : null,
    node.place || null,
    node.date || null,
  ].filter(Boolean);
  return (
    <div className="max-w-md mx-auto rounded-2xl p-3.5 flex gap-3"
      style={{ background: 'hsla(252,35%,9%,0.94)', border: `1px solid ${node.color}55`, boxShadow: `0 10px 40px -10px ${node.color}66`, backdropFilter: 'blur(16px)' }}>
      {node.image || node.privatePhoto ? (
        <PrivateLogPhoto logId={node.kind === 'log' ? node.refId : undefined} privatePhoto={node.privatePhoto} legacyUrl={node.image} alt={node.label} className="w-16 h-16 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center" style={{ background: `${node.color}22`, border: `1px solid ${node.color}44` }}>
          <Icon size={22} style={{ color: node.color }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: node.color }}>
              {KIND_LABEL[node.kind]}{GROUP_LABEL[node.group] ? ` · ${GROUP_LABEL[node.group]}` : ''}
            </div>
            <div className="text-white font-bold text-[15px] leading-tight truncate">{node.label}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/45 hover:text-white shrink-0"><X size={15} /></button>
        </div>
        {meta.length > 0 && <div className="text-white/60 text-[11px] mt-0.5 truncate">{meta.join(' · ')}</div>}
        <div className="flex gap-2 mt-2.5">
          {node.route && !isSample && (
            <Link to={node.route} className="px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: node.color, color: '#0a0a14' }}>
              Open
            </Link>
          )}
          {!isSample && (
            <button type="button" onClick={() => onAsk(node)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white/85"
              style={{ border: '1px solid hsla(0,0%,100%,0.16)' }}>
              Ask Clover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function VaultList({ graph, matches, onSelect }) {
  const records = (matches || graph.nodes).filter((n) => n.kind === 'find' || n.kind === 'log' || n.kind === 'trip');
  const byGroup = new Map();
  for (const n of records) {
    const key = n.kind === 'trip' ? 'Expeditions' : GROUP_LABEL[n.group] || 'Unsorted';
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(n);
  }
  return (
    <div className="absolute inset-0 overflow-y-auto pt-40 pb-28 px-4">
      <div className="max-w-md mx-auto space-y-4">
        {records.length === 0 && <p className="text-white/55 text-sm text-center pt-6">Nothing to show yet.</p>}
        {[...byGroup.entries()].map(([group, items]) => (
          <section key={group}>
            <h2 className="text-[10px] uppercase tracking-[0.22em] text-white/55 font-bold mb-1.5">{group} · {items.length}</h2>
            <ul className="space-y-1.5">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => onSelect(n.id)}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={{ background: 'hsla(250,35%,10%,0.7)', border: '1px solid hsla(270,30%,35%,0.25)' }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: n.color, boxShadow: `0 0 8px ${n.color}` }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-white text-[13px] font-semibold truncate">{n.label}</span>
                      <span className="block text-white/55 text-[11px] truncate">{[n.place, n.date].filter(Boolean).join(' · ')}</span>
                    </span>
                    {n.rarity && <span className="text-[9px] uppercase tracking-wider text-white/55">{n.rarity}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}