import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Sparkles, Hexagon } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { useEntityList } from '@/lib/useEntityQuery';

// Amethyst-themed palette for the bars
const PALETTE = [
  'hsl(280 100% 70%)',
  'hsl(265 90% 60%)',
  'hsl(250 85% 65%)',
  'hsl(295 80% 65%)',
  'hsl(220 85% 65%)',
  'hsl(195 100% 60%)',
  'hsl(310 75% 65%)',
];

// Global WeakMap cache to store pre-computed mineral lookup Maps.
// Key: referentially stable minerals array
// Value: Map containing case-insensitive mineral name -> crystal_system mapping
export const mineralLookupCache = new WeakMap();

/**
 * Retrieves a cached lookup Map or computes it if missing.
 * @param {Array} minerals
 * @returns {Map<string, string>}
 */
export function getMineralLookup(minerals) {
  if (!minerals || !Array.isArray(minerals)) return new Map();
  if (!mineralLookupCache.has(minerals)) {
    const lookup = new Map();
    for (const m of minerals) {
      if (m.name && m.crystal_system) {
        lookup.set(m.name.toLowerCase().trim(), m.crystal_system);
      }
    }
    mineralLookupCache.set(minerals, lookup);
  }
  return mineralLookupCache.get(minerals);
}

export default function CrystalSystemInsights({ specimens }) {
  const { data: minerals = [], isLoading: loading } = useEntityList('Mineral');

  const data = useMemo(() => {
    if (!specimens?.length) return [];

    // Retrieve pre-computed mineral lookup Map from the WeakMap cache,
    // avoiding re-building the map on every change to specimens.
    const lookup = getMineralLookup(minerals);

    // Fallback table for common mineral families when not in DB
    // Maps a mineral name → { system, parent }
    const FALLBACKS = {
      agate: { system: 'Trigonal (Quartz Family)' },
      chalcedony: { system: 'Trigonal (Quartz Family)' },
      jasper: { system: 'Trigonal (Quartz Family)' },
      onyx: { system: 'Trigonal (Quartz Family)' },
      carnelian: { system: 'Trigonal (Quartz Family)' },
      chrysoprase: { system: 'Trigonal (Quartz Family)' },
      bloodstone: { system: 'Trigonal (Quartz Family)' },
      flint: { system: 'Trigonal (Quartz Family)' },
      chert: { system: 'Trigonal (Quartz Family)' },
      quartz: { system: 'Trigonal' },
      amethyst: { system: 'Trigonal' },
      citrine: { system: 'Trigonal' },
      'rose quartz': { system: 'Trigonal' },
      'smoky quartz': { system: 'Trigonal' },
      'tiger eye': { system: 'Trigonal' },
      tigereye: { system: 'Trigonal' },
      aventurine: { system: 'Trigonal' },
      opal: { system: 'Amorphous' },
      obsidian: { system: 'Amorphous' },
      pyrite: { system: 'Cubic' },
      galena: { system: 'Cubic' },
      fluorite: { system: 'Cubic' },
      halite: { system: 'Cubic' },
      garnet: { system: 'Cubic' },
      diamond: { system: 'Cubic' },
      calcite: { system: 'Trigonal' },
      tourmaline: { system: 'Trigonal' },
      hematite: { system: 'Trigonal' },
      beryl: { system: 'Hexagonal' },
      emerald: { system: 'Hexagonal' },
      aquamarine: { system: 'Hexagonal' },
      apatite: { system: 'Hexagonal' },
      topaz: { system: 'Orthorhombic' },
      olivine: { system: 'Orthorhombic' },
      peridot: { system: 'Orthorhombic' },
      gypsum: { system: 'Monoclinic' },
      malachite: { system: 'Monoclinic' },
      azurite: { system: 'Monoclinic' },
      mica: { system: 'Monoclinic' },
      muscovite: { system: 'Monoclinic' },
      turquoise: { system: 'Triclinic' },
      labradorite: { system: 'Triclinic' },
    };

    const counts = {};
    for (const s of specimens) {
      const key = s.mineral_name?.toLowerCase().trim();
      let sys = key ? lookup.get(key) : null;
      if (!sys && key && FALLBACKS[key]) sys = FALLBACKS[key].system;
      const label = sys || 'Unknown';
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([system, count]) => ({ system, count }))
      .sort((a, b) => b.count - a.count);
  }, [specimens, minerals]);

  if (loading) return null;
  if (!specimens?.length) return null;

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const top = data[0];

  return (
    <GlassPanel className="mb-6">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Hexagon className="text-amethyst-glow" size={14} />
          <span className="text-amethyst-glow text-[10px] uppercase tracking-[0.3em]">
            Insights
          </span>
        </div>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-white font-semibold text-lg tracking-wide">Crystal Systems</h3>
          {top && top.system !== 'Unknown' && (
            <span className="text-[10px] text-amethyst/70 flex items-center gap-1">
              <Sparkles size={10} />
              Most: {top.system}
            </span>
          )}
        </div>

        {data.length === 0 ? (
          <div className="text-center py-6 text-white/50 text-sm">
            No crystal system data yet.
          </div>
        ) : (
          <>
            <div className="h-44 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="system"
                    stroke="hsl(280 30% 70%)"
                    tick={{ fontSize: 10, fill: 'hsl(280 30% 80%)' }}
                    interval={0}
                    angle={data.length > 4 ? -25 : 0}
                    textAnchor={data.length > 4 ? 'end' : 'middle'}
                    height={data.length > 4 ? 50 : 24}
                  />
                  <YAxis
                    stroke="hsl(280 30% 70%)"
                    tick={{ fontSize: 10, fill: 'hsl(280 30% 80%)' }}
                    allowDecimals={false}
                    width={24}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsla(280, 100%, 60%, 0.08)' }}
                    contentStyle={{
                      background: 'hsla(240, 30%, 8%, 0.95)',
                      border: '1px solid hsla(280, 60%, 50%, 0.3)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'hsl(280 100% 80%)' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[10px] text-white/40 text-center tracking-wide">
              {data.length} system{data.length !== 1 ? 's' : ''} across {total} specimen{total !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </GlassPanel>
  );
}