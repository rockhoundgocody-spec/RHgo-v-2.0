import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Gem, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SpecimenPicker from '@/components/compare/SpecimenPicker.jsx';
import CompareTable from '@/components/compare/CompareTable.jsx';

/**
 * LibraryCompare — pick two specimens from the user's collection and
 * compare them side-by-side against mineral reference data.
 * (Previously the body of /compare.)
 */
export default function LibraryCompare() {
  const [specimens, setSpecimens] = useState([]);
  const [minerals, setMinerals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerSlot, setPickerSlot] = useState(null);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-amethyst/60">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (specimens.length < 2) {
    return (
      <GlassPanel className="p-10 text-center">
        <Gem className="mx-auto text-amethyst/40 mb-3" size={40} />
        <p className="text-white/70">Need at least 2 specimens to compare.</p>
        <p className="text-white/40 text-xs mt-2">Scan more finds to use this tool.</p>
      </GlassPanel>
    );
  }

  return (
    <>
      <CompareTable
        slots={enriched}
        onPickSlot={(i) => setPickerSlot(i)}
        onClearSlot={clearSlot}
      />
      {pickerSlot !== null && (
        <SpecimenPicker
          specimens={specimens}
          excludeIds={picked.filter(Boolean).map((p) => p.id)}
          onPick={handlePick}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  );
}