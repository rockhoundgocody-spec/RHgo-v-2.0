import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Gem, MapPin, Sparkles, Layers } from 'lucide-react';
import { useEntityList } from '@/lib/useEntityQuery';
import EmptyState from '@/components/visuals/EmptyState.jsx';
import { SkeletonGrid } from '@/components/visuals/SkeletonCard.jsx';

const ALBUM_DEFS = [
  {
    id: 'legendary',
    title: 'Legendary Vault',
    blurb: 'The finds that still make your pulse jump.',
    icon: Sparkles,
    color: '#a78bfa',
    match: (s) => s.rarity === 'legendary' || s.rarity === 'rare',
  },
  {
    id: 'verified',
    title: 'Field Verified',
    blurb: 'High-confidence IDs ready to show off.',
    icon: Gem,
    color: '#34d399',
    match: (s) => s.verified || (s.ai_confidence ?? 0) >= 0.8,
  },
  {
    id: 'mapped',
    title: 'Pinned Places',
    blurb: 'Specimens with a find spot on the map.',
    icon: MapPin,
    color: '#22d3ee',
    match: (s) => s.lat != null && s.lng != null,
  },
  {
    id: 'steward',
    title: 'Left in Place',
    blurb: 'You documented them and let the land keep them.',
    icon: Layers,
    color: '#fbbf24',
    match: (s) => s.disposition === 'left_in_place' || s.left_in_place,
  },
];

/**
 * Collections — smart albums derived from your specimens.
 * Replaces the broken SharedCollection entity UI.
 */
export default function Collections() {
  const { data: specimens = [], isLoading } = useEntityList('Specimen', '-found_date');
  const [active, setActive] = useState('legendary');
  const [customName, setCustomName] = useState('');
  const [customAlbums, setCustomAlbums] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rhgo_custom_albums') || '[]');
    } catch {
      return [];
    }
  });

  const albums = useMemo(() => {
    const base = ALBUM_DEFS.map((def) => ({
      ...def,
      items: specimens.filter(def.match),
    }));
    const custom = (customAlbums || []).map((c) => ({
      id: c.id,
      title: c.title,
      blurb: 'Your custom album',
      icon: Plus,
      color: '#9FE8D0',
      items: specimens.filter((s) => (c.ids || []).includes(s.id)),
    }));
    return [...base, ...custom];
  }, [specimens, customAlbums]);

  const current = albums.find((a) => a.id === active) || albums[0];

  const addCustom = () => {
    const title = customName.trim().slice(0, 40);
    if (!title) return;
    const next = [...customAlbums, { id: `c_${Date.now()}`, title, ids: [] }];
    setCustomAlbums(next);
    localStorage.setItem('rhgo_custom_albums', JSON.stringify(next));
    setCustomName('');
    setActive(next[next.length - 1].id);
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-28 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-semibold">Curated</div>
        <h1 className="text-2xl font-black text-white tracking-tight">Collections</h1>
        <p className="text-white/40 text-[12px] mt-1">Smart albums that assemble themselves from your GeoDex.</p>
      </div>

      {isLoading ? (
        <SkeletonGrid count={4} cols={2} />
      ) : specimens.length === 0 ? (
        <EmptyState
          icon="💎"
          title="No albums yet"
          body="Scan your first specimen and collections will light up automatically."
          ctaLabel="Scan a find"
          ctaTo="/scan"
        />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {albums.map((a) => {
              const Icon = a.icon;
              const on = a.id === current?.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActive(a.id)}
                  className="shrink-0 px-3 py-2 rounded-2xl text-left transition active:scale-95"
                  style={{
                    background: on ? `${a.color}22` : 'hsla(245,25%,10%,0.8)',
                    border: `1px solid ${on ? `${a.color}55` : 'hsla(270,30%,35%,0.2)'}`,
                    minWidth: 132,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} style={{ color: a.color }} />
                    <span className="text-[11px] font-bold text-white truncate">{a.title}</span>
                  </div>
                  <div className="text-[10px] tabular-nums" style={{ color: a.color }}>{a.items.length}</div>
                </button>
              );
            })}
          </div>

          <div className="page-card p-4 mb-4">
            <div className="text-white font-bold text-sm">{current?.title}</div>
            <p className="text-white/45 text-[12px] mt-1">{current?.blurb}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {(current?.items || []).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
              >
                <Link to={`/specimen/${s.id}`} className="block rounded-2xl overflow-hidden page-card">
                  <div className="aspect-square bg-black/40 relative">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.mineral_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🪨</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2"
                      style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                      <div className="text-white text-[12px] font-semibold truncate">{s.mineral_name}</div>
                      <div className="text-white/45 text-[10px] capitalize">{s.rarity || 'common'}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {(current?.items || []).length === 0 && (
            <EmptyState
              icon="🔍"
              title="This album is empty"
              body="Keep scanning — matches appear here automatically."
              ctaLabel="Open scanner"
              ctaTo="/scan"
            />
          )}

          <div className="page-card p-3 flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Name a custom album…"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={addCustom}
              className="px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider"
              style={{ background: '#9FE8D0', color: '#0a0a14' }}
            >
              Add
            </button>
          </div>
          <p className="text-white/25 text-[10px] mt-2 text-center">
            Tip: open any specimen from GeoDex to manage details. Custom albums stay on this device for now.
          </p>
        </>
      )}
    </div>
  );
}
