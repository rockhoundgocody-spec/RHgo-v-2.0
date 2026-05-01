import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, GitCompareArrows, Gem, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SpecimenPicker from '@/components/compare/SpecimenPicker.jsx';
import CompareTable from '@/components/compare/CompareTable.jsx';

export default function Compare() {
  const [specimens, setSpecimens] = useState([]);
  const [minerals, setMinerals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerSlot, setPickerSlot] = useState(null); // 0 | 1 | null
  const [picked, setPicked] = useState([null, null]);

  useEffect(() => {
    Promise.all([
      base44.entities.Specimen.list('-found_date'),
      base44.entities.Mineral.list(),
    ]).then(([s, m]) => {
      setSpecimens(s || []);
      setMinerals(m || []);
      setLoading(false);
    });
  }, []);

  // Build a name → mineral lookup so we can join Specimen.mineral_name → Mineral fields
  const mineralByName = useMemo(() => {
    const map = {};
    for (const m of minerals) {
      if (m?.name) map[m.name.toLowerCase()] = m;
    }
    return map;
  }, [minerals]);

  const enriched = useMemo(
    () =>
      picked.map((spec) => {
        if (!spec) return null;
        const ref = mineralByName[(spec.mineral_name || '').toLowerCase()] || {};
        return { specimen: spec, mineral: ref };
      }),
    [picked, mineralByName]
  );

  const handlePick = (spec) => {
    if (pickerSlot === null) return;
    const next = [...picked];
    next[pickerSlot] = spec;
    setPicked(next);
    setPickerSlot(null);
  };

  const clearSlot = (i) => {
    const next = [...picked];
    next[i] = null;
    setPicked(next);
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/collection"
          className="flex items-center gap-1.5 text-amethyst/70 hover:text-amethyst-glow text-sm"
        >
          <ArrowLeft size={16} />
          Collection
        </Link>
        <div className="flex items-center gap-2 text-amethyst/60 text-[10px] uppercase tracking-[0.3em]">
          <GitCompareArrows size={12} />
          Compare
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white tracking-wide text-center mb-1">
        Mineral Compare
      </h1>
      <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] text-center mb-6">
        Side-by-side analysis
      </p>

      {loading ? (
        <div className="flex justify-center py-12 text-amethyst/60">
          <Loader2 className="animate-spin" />
        </div>
      ) : specimens.length < 2 ? (
        <GlassPanel className="p-10 text-center">
          <Gem className="mx-auto text-amethyst/40 mb-3" size={40} />
          <p className="text-white/70">Need at least 2 specimens to compare.</p>
          <p className="text-white/40 text-xs mt-2">Scan more finds to use this tool.</p>
        </GlassPanel>
      ) : (
        <CompareTable
          slots={enriched}
          onPickSlot={(i) => setPickerSlot(i)}
          onClearSlot={clearSlot}
        />
      )}

      {pickerSlot !== null && (
        <SpecimenPicker
          specimens={specimens}
          excludeIds={picked.filter(Boolean).map((p) => p.id)}
          onPick={handlePick}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
}